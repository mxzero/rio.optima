import { NextResponse } from "next/server";
import { errorResponse, readSlideRequest } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { deleteSlide, getSlideFor, updateSlide } from "@/lib/server/slides";

type Ctx = RouteContext<"/api/slider/slides/[id]">;

export async function GET(_request: Request, ctx: Ctx) {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    return NextResponse.json({ slide: await getSlideFor(user, (await ctx.params).id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    const { raw, upload } = await readSlideRequest(request);
    return NextResponse.json({ slide: await updateSlide(user, (await ctx.params).id, raw, upload) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    await deleteSlide(user, (await ctx.params).id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
