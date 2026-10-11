import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Optimistic check only: send visitors without a session cookie to log in.
// Pages and API routes verify the session and the user's role themselves.
// API routes are deliberately not matched: proxy buffers request bodies and
// would truncate large uploads.
export function proxy(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/slider/manage/:path*", "/slider/fullscreen", "/admin/:path*"],
};
