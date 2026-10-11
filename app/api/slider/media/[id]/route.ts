import { Readable } from "node:stream";
import { errorResponse } from "@/lib/server/http";
import { NextResponse } from "next/server";
import { SessionUser } from "@/lib/auth";
import { requireUser } from "@/lib/server/session";
import { findPlayerOwner, openMediaFor } from "@/lib/server/slides";

// Sends an uploaded file the viewer may see: a redirect to a short-lived signed
// Blob URL, or a local file stream with Range support so videos can seek.
// Public player links pass ?player=<key> instead of a login; the file must be
// in that (active) user's playlist.
export async function GET(request: Request, ctx: RouteContext<"/api/slider/media/[id]">) {
  const key = new URL(request.url).searchParams.get("player");
  let viewer: SessionUser | null;
  if (key) {
    viewer = await findPlayerOwner(key);
    if (!viewer) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  } else {
    const { user, denied } = await requireUser("slider");
    if (denied) return denied;
    viewer = user;
  }
  try {
    const media = await openMediaFor(viewer, (await ctx.params).id);
    if ("redirect" in media) {
      return new Response(null, { status: 302, headers: { Location: media.redirect, "Cache-Control": "private, no-store" } });
    }
    const headers = new Headers({
      "Content-Type": media.contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
    if (range && (range[1] || range[2])) {
      const start = range[1] ? Number(range[1]) : Math.max(0, media.size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), media.size - 1) : media.size - 1;
      if (start >= media.size || start > end) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${media.size}` } });
      }
      headers.set("Content-Range", `bytes ${start}-${end}/${media.size}`);
      headers.set("Content-Length", String(end - start + 1));
      return new Response(Readable.toWeb(media.stream(start, end)) as ReadableStream, { status: 206, headers });
    }
    headers.set("Content-Length", String(media.size));
    return new Response(Readable.toWeb(media.stream()) as ReadableStream, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
