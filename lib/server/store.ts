// Record storage for users and slides, one named collection each. Backends, in
// order of preference:
//
// - Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN): one hash per collection.
// - Vercel Blob (BLOB_READ_WRITE_TOKEN): one private JSON file per collection
//   under data/, written with ETag checks so concurrent edits don't clobber
//   each other. Lets a deployment run with only a Blob store connected.
// - JSON files under .data/ (or RIO_DATA_DIR), for localhost or any server
//   with a writable disk.

import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { BlobNotFoundError, BlobPreconditionFailedError, get as getBlob, head as headBlob, put as putBlob } from "@vercel/blob";

export const DATA_DIR = process.env.RIO_DATA_DIR || path.join(process.cwd(), ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export class SetupError extends Error {}

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN || null;

// Lets sessions derive a signing key when SESSION_SECRET isn't set.
export const storageSecret = redisToken || blobToken;

function assertWritableStorage() {
  if (!redis && !blobToken && process.env.VERCEL) {
    throw new SetupError("Storage isn't set up yet. In Vercel, connect a Blob store to this project, then redeploy.");
  }
}

type Records<T> = Record<string, T>;

// A backend reads a whole collection and applies changes to it atomically.
type Backend = {
  read<T>(name: string): Promise<Records<T> | null>;
  // Creates the collection only if it doesn't exist yet.
  create<T>(name: string, records: Records<T>): Promise<void>;
  set<T>(name: string, id: string, record: T): Promise<void>;
  remove(name: string, id: string): Promise<void>;
  // Read-modify-write of the whole collection, with no other write in between.
  mutate<T>(name: string, change: (records: Records<T>) => void): Promise<void>;
};

// ---- Redis ----

const redisBackend = (client: Redis): Backend => ({
  async read<T>(name: string) {
    if (!(await client.exists(`rio:seeded:${name}`))) return null;
    return (await client.hgetall<Records<T>>(`rio:${name}`)) ?? {};
  },
  async create(name, records) {
    // SET NX makes seeding happen exactly once across all instances.
    if (!(await client.set(`rio:seeded:${name}`, "1", { nx: true }))) return;
    if (Object.keys(records).length) await client.hset(`rio:${name}`, records);
  },
  async set(name, id, record) {
    await client.hset(`rio:${name}`, { [id]: record });
  },
  async remove(name, id) {
    await client.hdel(`rio:${name}`, id);
  },
  // Upstash's REST API has no WATCH, so hold a short lock key instead.
  async mutate<T>(name: string, change: (records: Records<T>) => void) {
    const lock = `rio:lock:${name}`;
    const owner = crypto.randomUUID();
    for (let attempt = 0; !(await client.set(lock, owner, { nx: true, px: 5000 })); attempt++) {
      if (attempt >= 50) throw new Error(`Timed out waiting to update ${name}.`);
      await new Promise((resolve) => setTimeout(resolve, 40 + Math.random() * 40));
    }
    try {
      const before = (await client.hgetall<Records<T>>(`rio:${name}`)) ?? {};
      const records: Records<T> = structuredClone(before);
      change(records);
      const changed = Object.fromEntries(
        Object.entries(records).filter(([id, record]) => JSON.stringify(record) !== JSON.stringify(before[id])),
      );
      const removed = Object.keys(before).filter((id) => !(id in records));
      if (Object.keys(changed).length) await client.hset(`rio:${name}`, changed);
      if (removed.length) await client.hdel(`rio:${name}`, ...removed);
    } finally {
      if ((await client.get(lock)) === owner) await client.del(lock);
    }
  },
});

// ---- Vercel Blob ----

const blobPath = (name: string) => `data/${name}.json`;

// The ETag must come from head(): it's the store's version id that put()'s
// ifMatch compares against. get() reports the CDN's ETag header, which doesn't
// match. Reading head first is safe: if the file changes before get(), the
// stale ETag makes the write fail and retry.
async function readBlobJson<T>(name: string) {
  let etag: string;
  try {
    etag = (await headBlob(blobPath(name))).etag;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
  const result = await getBlob(blobPath(name), { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  return { records: JSON.parse(text) as Records<T>, etag };
}

async function writeBlobJson(name: string, records: unknown, etag: string | null) {
  await putBlob(blobPath(name), JSON.stringify(records), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: etag !== null,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

// Read-modify-write, retried when another request changed the file first.
async function updateBlob<T>(name: string, change: (records: Records<T>) => void) {
  for (let attempt = 0; ; attempt++) {
    const current = await readBlobJson<T>(name);
    const records = current?.records ?? {};
    change(records);
    try {
      await writeBlobJson(name, records, current?.etag ?? null);
      return;
    } catch (error) {
      const conflict = error instanceof BlobPreconditionFailedError || /already exists/i.test(String(error));
      if (!conflict || attempt >= 6) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1) + Math.random() * 50));
    }
  }
}

const blobBackend: Backend = {
  async read<T>(name: string) {
    return (await readBlobJson<T>(name))?.records ?? null;
  },
  async create(name, records) {
    try {
      await writeBlobJson(name, records, null);
    } catch (error) {
      // Another request seeded it first; keep theirs.
      if (!/already exists/i.test(String(error)) && !(error instanceof BlobPreconditionFailedError)) throw error;
    }
  },
  async set(name, id, record) {
    await updateBlob(name, (records) => {
      records[id] = record;
    });
  },
  async remove(name, id) {
    await updateBlob(name, (records) => {
      delete records[id];
    });
  },
  mutate: updateBlob,
};

// ---- Local files ----

// Route handlers can be bundled separately, so keep the write lock on
// globalThis to serialize every read-modify-write in this process.
const shared = globalThis as typeof globalThis & { __rioStoreLock?: Promise<unknown> };

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = shared.__rioStoreLock ?? Promise.resolve();
  const next = previous.then(task, task);
  shared.__rioStoreLock = next.catch(() => {});
  return next;
}

async function readFileRecords<T>(name: string): Promise<Records<T> | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8")) as T[];
    return Object.fromEntries(parsed.map((record) => [(record as { id: string }).id, record]));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeFileRecords(name: string, records: Records<unknown>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, `${name}.json`);
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(Object.values(records), null, 2));
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

const fileBackend: Backend = {
  read: readFileRecords,
  create: (name, records) =>
    withLock(async () => {
      if ((await readFileRecords(name)) === null) await writeFileRecords(name, records);
    }),
  set: (name, id, record) =>
    withLock(async () => {
      const records = (await readFileRecords(name)) ?? {};
      records[id] = record;
      await writeFileRecords(name, records);
    }),
  remove: (name, id) =>
    withLock(async () => {
      const records = (await readFileRecords(name)) ?? {};
      delete records[id];
      await writeFileRecords(name, records);
    }),
  mutate: <T>(name: string, change: (records: Records<T>) => void) =>
    withLock(async () => {
      const records = (await readFileRecords<T>(name)) ?? {};
      change(records);
      await writeFileRecords(name, records);
    }),
};

const backend: Backend = redis ? redisBackend(redis) : blobToken ? blobBackend : fileBackend;

// ---- Collections ----

export type Collection<T extends { id: string }> = {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  put(record: T): Promise<void>;
  remove(id: string): Promise<void>;
  // Changes several records at once, keyed by id. `change` may run more than
  // once (Blob retries on conflict), so it must only touch `records`.
  update(change: (records: Records<T>) => void): Promise<void>;
};

// A named set of records, seeded the first time it's read while missing.
export function collection<T extends { id: string }>(name: string, seed: () => Promise<T[]>): Collection<T> {
  async function readAll(): Promise<Records<T>> {
    assertWritableStorage();
    const existing = await backend.read<T>(name);
    if (existing) return existing;
    await backend.create(name, Object.fromEntries((await seed()).map((record) => [record.id, record])));
    return (await backend.read<T>(name)) ?? {};
  }

  return {
    list: async () => Object.values(await readAll()),
    get: async (id) => (await readAll())[id] ?? null,
    async put(record) {
      await readAll();
      await backend.set(name, record.id, record);
    },
    async remove(id) {
      await readAll();
      await backend.remove(name, id);
    },
    async update(change) {
      await readAll();
      await backend.mutate(name, change);
    },
  };
}
