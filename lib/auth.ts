// Shared between server and browser code. Nothing secret lives here.

export const SESSION_COOKIE = "rio_session";
// Set on a TV after it signs in at /sfs/<code>; holds its screen slot.
export const SCREEN_COOKIE = "rio_screen";

export const MAX_TVS = 100;

// What a TV plays: everything, or one TV number's media.
export type TvChoice = number | "all";

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
  // 3-character TV code like K7M, used in short player links (/sfs/K7M).
  tvCode: string;
  // How many screens may play this account's media at the same time.
  totalTvs: number;
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

// TV codes: a letter, then 2 more characters from the same alphabet, at least
// one of them a digit (K7M, R2D).
export const TV_CODE_LETTERS = SHORT_ID_ALPHABET.replace(/[0-9]/g, "");
const TV_CODE = /^[A-Z][A-Z0-9]{2}$/i;

export function isValidTvCode(code: string | undefined): code is string {
  return Boolean(code && TV_CODE.test(code) && /[0-9]/.test(code));
}

export function tvLabel(tv: TvChoice) {
  return tv === "all" ? "All TVs" : `TV ${tv}`;
}

export function parseTvChoice(value: unknown): TvChoice | null {
  if (value === "all") return "all";
  const tv = Number(value);
  return Number.isInteger(tv) && tv >= 1 && tv <= MAX_TVS ? tv : null;
}

// Which user a player key points at: a TV code (/sfs/K7M), or an older
// /slider/fullscreen link ending in a short id (sam-sub-RIO-7K2QX) or, from
// before short ids existed, the full user id. Old links keep working.
export function parsePlayerKey(key: string): { tvCode: string } | { shortId: string } | { id: string } | null {
  if (TV_CODE.test(key)) return { tvCode: key.toUpperCase() };
  const short = key.match(SHORT_ID_AT_END)?.[1];
  if (short) return { shortId: short.toUpperCase() };
  const id = key.match(UUID_AT_END)?.[1];
  return id ? { id: id.toLowerCase() } : null;
}

// Public player links look like /sfs/K7M.
export function playerPath(user: Pick<SessionUser, "tvCode">) {
  return `/sfs/${user.tvCode}`;
}

export function roleLabel(role: Role) {
  return ROLES.find((item) => item.value === role)?.label ?? role;
}

export function serviceLabel(service: Service) {
  return SERVICES.find((item) => item.value === service)?.label ?? service;
}
