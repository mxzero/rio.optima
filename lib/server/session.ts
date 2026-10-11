import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SessionUser, canUseSlider, isAdmin } from "@/lib/auth";
import { DATA_DIR } from "@/lib/server/store";
import { findUserById } from "@/lib/server/users";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

let secretPromise: Promise<Buffer> | null = null;

// SESSION_SECRET wins; otherwise a random secret is generated once into .data/.
function secret() {
  secretPromise ??= (async () => {
    if (process.env.SESSION_SECRET) return Buffer.from(process.env.SESSION_SECRET);
    const file = path.join(DATA_DIR, "session-secret");
    try {
      return Buffer.from(await fs.readFile(file, "utf8"), "hex");
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const value = crypto.randomBytes(32);
      await fs.writeFile(file, value.toString("hex"), { flag: "wx" }).catch(() => {});
      return Buffer.from(await fs.readFile(file, "utf8"), "hex");
    }
  })();
  return secretPromise;
}

async function sign(payload: string) {
  return crypto.createHmac("sha256", await secret()).update(payload).digest("base64url");
}

export async function createSessionToken(userId: string) {
  const payload = `${userId}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await sign(payload)}`;
}

async function readSessionToken(token: string | undefined) {
  const [userId, expires, signature] = token?.split(".") ?? [];
  if (!userId || !expires || !signature) return null;
  const expected = Buffer.from(await sign(`${userId}.${expires}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

// The signed-in user, re-read from storage so role changes and deletions
// apply immediately.
export async function getSessionUser(): Promise<SessionUser | null> {
  const userId = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  return userId ? findUserById(userId) : null;
}

type Guard = { user: SessionUser; denied?: never } | { user?: never; denied: NextResponse };

export async function requireUser(need: "any" | "slider" | "admin" = "any"): Promise<Guard> {
  const user = await getSessionUser();
  if (!user) return { denied: NextResponse.json({ error: "Please log in." }, { status: 401 }) };
  if (need === "admin" && !isAdmin(user)) {
    return { denied: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  }
  if (need === "slider" && !canUseSlider(user)) {
    return { denied: NextResponse.json({ error: "Your account doesn't include SLIDER." }, { status: 403 }) };
  }
  return { user };
}
