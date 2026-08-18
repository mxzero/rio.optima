import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = readSessionToken(token);
  return NextResponse.json({ user });
}
