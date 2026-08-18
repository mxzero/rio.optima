import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/slider/manage")) {
    const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/slider/manage", "/slider/manage/:path*"],
};
