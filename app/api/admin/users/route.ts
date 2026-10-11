import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { countSlidesByOwner } from "@/lib/server/slides";
import { createUser, listUsers } from "@/lib/server/users";

export async function GET() {
  const { denied } = await requireUser("admin");
  if (denied) return denied;
  const counts = await countSlidesByOwner();
  const users = (await listUsers()).map((user) => ({ ...user, mediaCount: counts.get(user.id) ?? 0 }));
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { denied } = await requireUser("admin");
  if (denied) return denied;
  try {
    const user = await createUser(await request.json());
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
