import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { errorResponse } from "@/lib/server/http";
import { SESSION_MAX_AGE, createSessionToken } from "@/lib/server/session";
import { verifyLogin } from "@/lib/server/users";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  let user;
  try {
    user = await verifyLogin(String(body.email || ""), String(body.password || ""));
  } catch (error) {
    return errorResponse(error);
  }
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json({ ok: false, error: "You do not have an active account." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, user });
  let token: string;
  try {
    token = await createSessionToken(user.id);
  } catch (error) {
    return errorResponse(error);
  }
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
