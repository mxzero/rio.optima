import { NextResponse } from "next/server";
import { SCREEN_COOKIE } from "@/lib/auth";
import { errorResponse } from "@/lib/server/http";
import { readScreenPass, releaseScreen } from "@/lib/server/screens";

// OFF on a playing TV: frees its slot right away and signs it out.
export async function POST() {
  try {
    const pass = await readScreenPass();
    if (pass) await releaseScreen(pass.slot);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SCREEN_COOKIE);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
