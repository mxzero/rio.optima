export const ADMIN = {
  name: "Admin",
  email: "admin@rio.optima",
  password: "Pass123!",
} as const;

export const SESSION_COOKIE = "rio_session";
export const SESSION_TOKEN = "rio-optima-admin";

export type SessionUser = {
  name: string;
  email: string;
};

export function credentialsMatch(email: string, password: string) {
  return (
    email.trim().toLowerCase() === ADMIN.email.toLowerCase() &&
    password === ADMIN.password
  );
}

export function readSessionToken(token: string | undefined): SessionUser | null {
  if (token !== SESSION_TOKEN) return null;
  return { name: ADMIN.name, email: ADMIN.email };
}
