// File-backed storage for users, slides and uploaded media. Everything lives
// under .data/ (or RIO_DATA_DIR), so it works on localhost or any server with a
// writable disk, but not on serverless hosts like Vercel.

import { promises as fs } from "node:fs";
import path from "node:path";

export const DATA_DIR = process.env.RIO_DATA_DIR || path.join(process.cwd(), ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

// Route handlers can be bundled separately, so keep the write lock on
// globalThis to serialize every read-modify-write in this process.
const shared = globalThis as typeof globalThis & { __rioStoreLock?: Promise<unknown> };

export function withLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = shared.__rioStoreLock ?? Promise.resolve();
  const next = previous.then(task, task);
  shared.__rioStoreLock = next.catch(() => {});
  return next;
}

export async function readJson<T>(name: string, seed: () => Promise<T> | T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, name), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const initial = await seed();
    await writeJson(name, initial);
    return initial;
  }
}

export async function writeJson(name: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, name);
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
