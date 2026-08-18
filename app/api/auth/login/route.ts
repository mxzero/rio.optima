import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TOKEN, credentialsMatch } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (!credentialsMatch(body.email || "", body.password || "")) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
