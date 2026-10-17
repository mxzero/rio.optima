import { NextResponse } from "next/server";
import { canUseSlider } from "@/lib/auth";
import { errorResponse } from "@/lib/server/http";
import { ScreenBusyError, claimScreen, readScreenPass } from "@/lib/server/screens";
import { findUserById } from "@/lib/server/users";

// A playing TV checks in to keep its slot. Anything but 200 sends it back to
// the sign-in screen, which says why.
export async function POST() {
  const pass = await readScreenPass();
  if (!pass) return NextResponse.json({ error: "This TV isn't signed in." }, { status: 401 });
  try {
    const owner = await findUserById(pass.userId);
    if (!canUseSlider(owner)) return NextResponse.json({ error: "This account isn't active." }, { status: 403 });
    await claimScreen(owner!, pass.tv, pass.slot);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ScreenBusyError) {
      return NextResponse.json({ error: error.message, reason: error.reason }, { status: 409 });
    }
    return errorResponse(error);
  }
}
