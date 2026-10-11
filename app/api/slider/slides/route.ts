import { NextResponse } from "next/server";
import { errorResponse, readSlideRequest } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { createSlide, listSlidesFor } from "@/lib/server/slides";

export async function GET() {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  return NextResponse.json({ slides: await listSlidesFor(user) });
}

export async function POST(request: Request) {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    const { raw, upload } = await readSlideRequest(request);
    return NextResponse.json({ slide: await createSlide(user, raw, upload) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
