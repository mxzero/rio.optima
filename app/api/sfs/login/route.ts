import { NextResponse } from "next/server";
import { canUseSlider, parseTvChoice } from "@/lib/auth";
import { errorResponse } from "@/lib/server/http";
import { ScreenBusyError, claimScreen, readScreenPass, setScreenCookie } from "@/lib/server/screens";
import { findUserByTvCode, verifyPasswordFor } from "@/lib/server/users";

// A TV signing in at /sfs/<code>: the code picks the account, the TV types the
// password and chooses a TV number (or All).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; tv?: unknown; password?: unknown };
  try {
    const owner = await findUserByTvCode(String(body.code || ""));
    if (!canUseSlider(owner)) {
      return NextResponse.json({ error: "This TV code isn't linked to an active SLIDER account." }, { status: 403 });
    }
    const tv = parseTvChoice(body.tv);
    if (tv === null) return NextResponse.json({ error: "Choose a TV number." }, { status: 400 });
    if (!(await verifyPasswordFor(owner!.id, String(body.password || "")))) {
      return NextResponse.json({ error: "Wrong password." }, { status: 401 });
    }
    // Same browser signing in again (say, to change TV number) keeps its slot.
    const pass = await readScreenPass();
    const slot = await claimScreen(owner!, tv, pass?.userId === owner!.id ? pass.slot : undefined);
    const response = NextResponse.json({ ok: true });
    await setScreenCookie(response, { slot, userId: owner!.id, tv });
    return response;
  } catch (error) {
    if (error instanceof ScreenBusyError) {
      return NextResponse.json({ error: error.message, reason: error.reason }, { status: 409 });
    }
    return errorResponse(error);
  }
}
