import { NextResponse } from "next/server";
import { SlideError } from "@/lib/server/slides";
import { UserError } from "@/lib/server/users";

export function errorResponse(error: unknown) {
  if (error instanceof SlideError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof UserError) return NextResponse.json({ error: error.message }, { status: 400 });
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

// Links and edits arrive as JSON. File uploads stream the raw file as the body,
// with the slide details URI-encoded in the X-Slide header.
export async function readSlideRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.startsWith("application/json")) {
    return { raw: (await request.json()) as unknown, upload: null };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(decodeURIComponent(request.headers.get("x-slide") || ""));
  } catch {
    throw new SlideError("Missing media details.");
  }
  return { raw, upload: { contentType: contentType.split(";")[0].trim(), body: request.body } };
}
