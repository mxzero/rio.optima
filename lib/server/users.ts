import crypto from "node:crypto";
import { promisify } from "node:util";
import {
  ROLES,
  Role,
  SERVICES,
  SHORT_ID_ALPHABET,
  SHORT_ID_PREFIX,
  Service,
  SessionUser,
  TV_CODE_LETTERS,
} from "@/lib/auth";
import { collection } from "@/lib/server/store";

const scrypt = promisify(crypto.scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

// Records saved before these fields existed have no `active` (they count as
// active) and no `shortId` or `tvCode` (assigned on first load).
type UserRecord = Omit<SessionUser, "active" | "shortId" | "tvCode"> & {
  active?: boolean;
  shortId?: string;
  tvCode?: string;
  passwordHash: string;
  createdAt: string;
};

function newShortId(taken: Set<string>) {
  for (;;) {
    let id = SHORT_ID_PREFIX;
    for (let i = 0; i < 5; i++) id += SHORT_ID_ALPHABET[crypto.randomInt(SHORT_ID_ALPHABET.length)];
    if (!taken.has(id)) {
      taken.add(id);
      return id;
    }
  }
}

// 24 × 32 × 32 = 24,576 codes in all.
function newTvCode(taken: Set<string>) {
  for (;;) {
    let code = TV_CODE_LETTERS[crypto.randomInt(TV_CODE_LETTERS.length)];
    for (let i = 0; i < 2; i++) code += SHORT_ID_ALPHABET[crypto.randomInt(SHORT_ID_ALPHABET.length)];
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
}

const takenIds = (all: UserRecord[], field: "shortId" | "tvCode") =>
  new Set(all.map((user) => user[field]).filter((id): id is string => Boolean(id)));

// First run: keep the original built-in admin so existing logins still work.
const SEED_ADMIN = { name: "Admin", email: "admin@rio.optima", password: "Pass123!" };

async function seedUsers(): Promise<UserRecord[]> {
  return [
    {
      id: crypto.randomUUID(),
      shortId: newShortId(new Set()),
      tvCode: newTvCode(new Set()),
      name: SEED_ADMIN.name,
      email: SEED_ADMIN.email,
      role: "admin",
      service: "slider",
      active: true,
      passwordHash: await hashPassword(SEED_ADMIN.password),
      createdAt: new Date().toISOString(),
    },
  ];
}

const users = collection<UserRecord>("users", seedUsers);
// Gives any user without a short id or TV code one, once per process.
let backfill: Promise<void> | null = null;

async function loadAll() {
  const all = await users.list();
  if (all.every((user) => user.shortId && user.tvCode)) return all;
  backfill ??= (async () => {
    const current = await users.list();
    const shortIds = takenIds(current, "shortId");
    const tvCodes = takenIds(current, "tvCode");
    for (const user of current) {
      if (user.shortId && user.tvCode) continue;
      await users.put({
        ...user,
        shortId: user.shortId || newShortId(shortIds),
        tvCode: user.tvCode || newTvCode(tvCodes),
      });
    }
  })().finally(() => {
    backfill = null;
  });
  await backfill;
  return users.list();
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function passwordMatches(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function toPublic({ id, shortId, tvCode, name, email, role, service, active }: UserRecord): SessionUser {
  return { id, shortId: shortId ?? "", tvCode: tvCode ?? "", name, email, role, service, active: active !== false };
}

function activeAdminCount(all: UserRecord[]) {
  return all.filter((item) => item.role === "admin" && item.active !== false).length;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function listUsers() {
  return (await loadAll())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((user) => ({ ...toPublic(user), createdAt: user.createdAt }));
}

export async function findUserById(id: string) {
  const user = (await loadAll()).find((item) => item.id === id);
  return user ? toPublic(user) : null;
}

export async function findUserByShortId(shortId: string) {
  const user = (await loadAll()).find((item) => item.shortId === shortId.toUpperCase());
  return user ? toPublic(user) : null;
}

export async function findUserByTvCode(tvCode: string) {
  const user = (await loadAll()).find((item) => item.tvCode === tvCode.toUpperCase());
  return user ? toPublic(user) : null;
}

export async function verifyLogin(email: string, password: string) {
  const user = (await loadAll()).find((item) => item.email === normalizeEmail(email));
  // Hash anyway on unknown emails so response time doesn't reveal which exist.
  const ok = await passwordMatches(password, user?.passwordHash ?? "scrypt$00$00");
  return user && ok ? toPublic(user) : null;
}

// ---- Validation ----

export type UserInput = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
  service?: unknown;
  active?: unknown;
};

type Checked = { name?: string; email?: string; password?: string; role?: Role; service?: Service; active?: boolean };

function checkInput(input: UserInput, creating: boolean): Checked | string {
  const out: Checked = {};
  if (creating || input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 80) return "Enter a name (up to 80 characters).";
    out.name = name;
  }
  if (creating || input.email !== undefined) {
    const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return "Enter a valid email address.";
    out.email = email;
  }
  if (creating || (input.password !== undefined && input.password !== "")) {
    const password = typeof input.password === "string" ? input.password : "";
    if (password.length < 8) return "Password must be at least 8 characters.";
    out.password = password;
  }
  if (creating || input.role !== undefined) {
    if (!ROLES.some((role) => role.value === input.role)) return "Choose a role: Admin or Subscriber.";
    out.role = input.role as Role;
  }
  if (creating || input.service !== undefined) {
    if (!SERVICES.some((service) => service.value === input.service)) return "Choose a service: TMS or Slider.";
    out.service = input.service as Service;
  }
  if (input.active !== undefined) {
    if (typeof input.active !== "boolean") return "Choose whether the account is active.";
    out.active = input.active;
  }
  return out;
}

export class UserError extends Error {}

export async function createUser(input: UserInput) {
  const checked = checkInput(input, true);
  if (typeof checked === "string") throw new UserError(checked);
  const all = await loadAll();
  if (all.some((user) => user.email === checked.email)) throw new UserError("A user with that email already exists.");
  const user: UserRecord = {
    id: crypto.randomUUID(),
    shortId: newShortId(takenIds(all, "shortId")),
    tvCode: newTvCode(takenIds(all, "tvCode")),
    name: checked.name!,
    email: checked.email!,
    role: checked.role!,
    service: checked.service!,
    active: checked.active ?? true,
    passwordHash: await hashPassword(checked.password!),
    createdAt: new Date().toISOString(),
  };
  await users.put(user);
  return toPublic(user);
}

export async function updateUser(actorId: string, id: string, input: UserInput) {
  const checked = checkInput(input, false);
  if (typeof checked === "string") throw new UserError(checked);
  const all = await loadAll();
  const user = all.find((item) => item.id === id);
  if (!user) throw new UserError("User not found.");
  if (checked.email && all.some((item) => item.id !== id && item.email === checked.email)) {
    throw new UserError("A user with that email already exists.");
  }
  const loses = (checked.role && checked.role !== "admin") || checked.active === false;
  if (loses && user.role === "admin" && user.active !== false) {
    if (id === actorId) {
      throw new UserError(
        checked.active === false ? "You can't deactivate your own account." : "You can't remove your own admin role.",
      );
    }
    if (activeAdminCount(all) <= 1) throw new UserError("There must be at least one active admin.");
  }
  const { password, ...rest } = checked;
  const updated: UserRecord = {
    ...user,
    ...rest,
    passwordHash: password ? await hashPassword(password) : user.passwordHash,
  };
  await users.put(updated);
  return toPublic(updated);
}

export async function deleteUser(actorId: string, id: string) {
  if (id === actorId) throw new UserError("You can't delete your own account.");
  const all = await loadAll();
  const user = all.find((item) => item.id === id);
  if (!user) throw new UserError("User not found.");
  if (user.role === "admin" && user.active !== false && activeAdminCount(all) <= 1) {
    throw new UserError("There must be at least one active admin.");
  }
  await users.remove(id);
}
