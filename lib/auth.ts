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
  name: string;
  email: string;
  role: Role;
  service: Service;
};

export type AdminUserRow = SessionUser & { createdAt: string; mediaCount: number };

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "admin";
}

export function canUseSlider(user: SessionUser | null | undefined) {
  return Boolean(user && (user.role === "admin" || user.service === "slider"));
}

export function roleLabel(role: Role) {
  return ROLES.find((item) => item.value === role)?.label ?? role;
}

export function serviceLabel(service: Service) {
  return SERVICES.find((item) => item.value === service)?.label ?? service;
}
