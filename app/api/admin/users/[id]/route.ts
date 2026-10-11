import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { deleteUser, updateUser } from "@/lib/server/users";

type Ctx = RouteContext<"/api/admin/users/[id]">;

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, denied } = await requireUser("admin");
  if (denied) return denied;
  try {
    const updated = await updateUser(user.id, (await ctx.params).id, await request.json());
    return NextResponse.json({ user: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { user, denied } = await requireUser("admin");
  if (denied) return denied;
  try {
    await deleteUser(user.id, (await ctx.params).id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
