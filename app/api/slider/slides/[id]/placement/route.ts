import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { placeSlide } from "@/lib/server/slides";

// Order and TV number, changed straight from the media table.
export async function PATCH(request: Request, ctx: RouteContext<"/api/slider/slides/[id]/placement">) {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    return NextResponse.json({ slide: await placeSlide(user, (await ctx.params).id, await request.json()) });
  } catch (error) {
    return errorResponse(error);
  }
}
