import crypto from "node:crypto";
import { promisify } from "node:util";
import { ROLES, Role, SERVICES, Service, SessionUser } from "@/lib/auth";
import { readJson, withLock, writeJson } from "@/lib/server/store";

const scrypt = promisify(crypto.scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

type UserRecord = SessionUser & { passwordHash: string; createdAt: string };

const FILE = "users.json";

// First run: keep the original built-in admin so existing logins still work.
const SEED_ADMIN = { name: "Admin", email: "admin@rio.optima", password: "Pass123!" };

async function seedUsers(): Promise<UserRecord[]> {
  return [
    {
      id: crypto.randomUUID(),
      name: SEED_ADMIN.name,
      email: SEED_ADMIN.email,
      role: "admin",
      service: "slider",
      passwordHash: await hashPassword(SEED_ADMIN.password),
      createdAt: new Date().toISOString(),
    },
  ];
}

const loadAll = () => readJson<UserRecord[]>(FILE, seedUsers);

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

function toPublic({ id, name, email, role, service }: UserRecord): SessionUser {
  return { id, name, email, role, service };
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function listUsers() {
  return (await loadAll()).map((user) => ({ ...toPublic(user), createdAt: user.createdAt }));
}

export async function findUserById(id: string) {
  const user = (await loadAll()).find((item) => item.id === id);
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
};

type Checked = { name?: string; email?: string; password?: string; role?: Role; service?: Service };

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
  return out;
}

export class UserError extends Error {}

export function createUser(input: UserInput) {
  return withLock(async () => {
    const checked = checkInput(input, true);
    if (typeof checked === "string") throw new UserError(checked);
    const users = await loadAll();
    if (users.some((user) => user.email === checked.email)) throw new UserError("A user with that email already exists.");
    const user: UserRecord = {
      id: crypto.randomUUID(),
      name: checked.name!,
      email: checked.email!,
      role: checked.role!,
      service: checked.service!,
      passwordHash: await hashPassword(checked.password!),
      createdAt: new Date().toISOString(),
    };
    await writeJson(FILE, [...users, user]);
    return toPublic(user);
  });
}

export function updateUser(actorId: string, id: string, input: UserInput) {
  return withLock(async () => {
    const checked = checkInput(input, false);
    if (typeof checked === "string") throw new UserError(checked);
    const users = await loadAll();
    const user = users.find((item) => item.id === id);
    if (!user) throw new UserError("User not found.");
    if (checked.email && users.some((item) => item.id !== id && item.email === checked.email)) {
      throw new UserError("A user with that email already exists.");
    }
    if (checked.role && checked.role !== "admin" && user.role === "admin") {
      if (id === actorId) throw new UserError("You can't remove your own admin role.");
      if (users.filter((item) => item.role === "admin").length <= 1) {
        throw new UserError("There must be at least one admin.");
      }
    }
    const { password, ...rest } = checked;
    const updated: UserRecord = {
      ...user,
      ...rest,
      passwordHash: password ? await hashPassword(password) : user.passwordHash,
    };
    await writeJson(FILE, users.map((item) => (item.id === id ? updated : item)));
    return toPublic(updated);
  });
}

export function deleteUser(actorId: string, id: string) {
  return withLock(async () => {
    if (id === actorId) throw new UserError("You can't delete your own account.");
    const users = await loadAll();
    const user = users.find((item) => item.id === id);
    if (!user) throw new UserError("User not found.");
    if (user.role === "admin" && users.filter((item) => item.role === "admin").length <= 1) {
      throw new UserError("There must be at least one admin.");
    }
    await writeJson(FILE, users.filter((item) => item.id !== id));
  });
}
