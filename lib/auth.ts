// Shared between server and browser code. Nothing secret lives here.

export const SESSION_COOKIE = "rio_session";

export const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "subscriber", label: "Subscriber" },
] as const;

export const SERVICES = [
  { value: "tms", label: "TMS" },
  { value: "slider", label: "Slider" },
] as const;

export type Role = (typeof ROLES)[number]["value"];
export type Service = (typeof SERVICES)[number]["value"];

export type SessionUser = {
  id: string;
  // Short, readable id like RIO-7K2QX, used in player links.
  shortId: string;
  name: string;
  email: string;
  role: Role;
  service: Service;
  active: boolean;
};

export type AdminUserRow = SessionUser & { createdAt: string; mediaCount: number };

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "admin";
}

export function canUseSlider(user: SessionUser | null | undefined) {
  return Boolean(user && user.active && (user.role === "admin" || user.service === "slider"));
}

// Short ids: "RIO-" plus 5 characters, without look-alikes (0/O, 1/I).
export const SHORT_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const SHORT_ID_PREFIX = "RIO-";
const SHORT_ID_AT_END = /(RIO-[A-Z0-9]{5})$/i;
const UUID_AT_END = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Public player links look like /slider/fullscreen/sam-sub-RIO-7K2QX. Only the
// id at the end matters; the name part just makes the link readable.
export function playerKey(user: Pick<SessionUser, "shortId" | "name">) {
  const slug = user.name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `${slug}-${user.shortId}` : user.shortId;
}

// Which user a player key points at. Links made before short ids existed end
// in the full user id, and keep working.
export function parsePlayerKey(key: string): { shortId: string } | { id: string } | null {
  const short = key.match(SHORT_ID_AT_END)?.[1];
  if (short) return { shortId: short.toUpperCase() };
  const id = key.match(UUID_AT_END)?.[1];
  return id ? { id: id.toLowerCase() } : null;
}

export function playerPath(user: Pick<SessionUser, "shortId" | "name">) {
  return `/slider/fullscreen/${playerKey(user)}`;
}

export function roleLabel(role: Role) {
  return ROLES.find((item) => item.value === role)?.label ?? role;
}

export function serviceLabel(service: Service) {
  return SERVICES.find((item) => item.value === service)?.label ?? service;
}
