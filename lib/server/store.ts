// Record storage for users and slides.
//
// - On Vercel (or anywhere Upstash Redis env vars are set): Redis hashes, one per
//   collection. Connect "Upstash for Redis" to the project in the Vercel
//   dashboard and it injects KV_REST_API_URL / KV_REST_API_TOKEN.
// - Otherwise: JSON files under .data/ (or RIO_DATA_DIR), for localhost or any
//   server with a writable disk.

import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

export const DATA_DIR = process.env.RIO_DATA_DIR || path.join(process.cwd(), ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export class SetupError extends Error {}

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Lets sessions derive a signing key when SESSION_SECRET isn't set.
export const storageSecret = redisToken || null;

function assertWritableStorage() {
  if (!redis && process.env.VERCEL) {
    throw new SetupError(
      "Storage isn't set up yet. In Vercel, connect Upstash for Redis and Vercel Blob to this project, then redeploy.",
    );
  }
}

// ---- File backend ----

// Route handlers can be bundled separately, so keep the write lock on
// globalThis to serialize every read-modify-write in this process.
const shared = globalThis as typeof globalThis & { __rioStoreLock?: Promise<unknown> };

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = shared.__rioStoreLock ?? Promise.resolve();
  const next = previous.then(task, task);
  shared.__rioStoreLock = next.catch(() => {});
  return next;
}

async function readFileRecords<T>(name: string): Promise<T[] | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8")) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeFileRecords(name: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, `${name}.json`);
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2));
  // Windows can briefly refuse the rename while a reader has the file open.
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(temp, target);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== "EPERM" && code !== "EBUSY")) {
        await fs.rm(temp, { force: true });
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
}

// ---- Collections ----

export type Collection<T extends { id: string }> = {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  put(record: T): Promise<void>;
  remove(id: string): Promise<void>;
};

// A named set of records, seeded once the first time it's used.
export function collection<T extends { id: string }>(name: string, seed: () => Promise<T[]>): Collection<T> {
  const key = `rio:${name}`;
  let seeded: Promise<void> | null = null;

  function ensureSeeded() {
    seeded ??= (async () => {
      assertWritableStorage();
      if (redis) {
        // SET NX makes seeding happen exactly once across all instances.
        if (await redis.set(`rio:seeded:${name}`, "1", { nx: true })) {
          const records = await seed();
          if (records.length) await redis.hset(key, Object.fromEntries(records.map((record) => [record.id, record])));
        }
      } else {
        await withLock(async () => {
          if ((await readFileRecords<T>(name)) === null) await writeFileRecords(name, await seed());
        });
      }
    })();
    seeded.catch(() => {
      seeded = null;
    });
    return seeded;
  }

  return {
    async list() {
      await ensureSeeded();
      if (redis) return Object.values((await redis.hgetall<Record<string, T>>(key)) ?? {});
      return (await readFileRecords<T>(name)) ?? [];
    },
    async get(id) {
      await ensureSeeded();
      if (redis) return (await redis.hget<T>(key, id)) ?? null;
      return ((await readFileRecords<T>(name)) ?? []).find((record) => record.id === id) ?? null;
    },
    async put(record) {
      await ensureSeeded();
      if (redis) {
        await redis.hset(key, { [record.id]: record });
        return;
      }
      await withLock(async () => {
        const records = (await readFileRecords<T>(name)) ?? [];
        const index = records.findIndex((item) => item.id === record.id);
        if (index >= 0) records[index] = record;
        else records.push(record);
        await writeFileRecords(name, records);
      });
    },
    async remove(id) {
      await ensureSeeded();
      if (redis) {
        await redis.hdel(key, id);
        return;
      }
      await withLock(async () => {
        const records = (await readFileRecords<T>(name)) ?? [];
        await writeFileRecords(
          name,
          records.filter((item) => item.id !== id),
        );
      });
    },
  };
}
