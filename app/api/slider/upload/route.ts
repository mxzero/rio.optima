import { HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/server/http";
import { MediaError, allowedTypes, blobFolder, maxBytes, uploadMode } from "@/lib/server/media";
import { requireUser } from "@/lib/server/session";
import { MediaType } from "@/lib/slider";

// Tells the browser how to upload: straight to Vercel Blob, or through the API.
export async function GET() {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    return NextResponse.json({ mode: uploadMode(), folder: blobFolder(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

// Issues a client token for one Blob upload, limited to the user's own folder
// and to the allowed file types and sizes.
export async function POST(request: Request) {
  const { user, denied } = await requireUser("slider");
  if (denied) return denied;
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(blobFolder(user.id)) || pathname.includes("..")) {
          throw new MediaError("Uploads must go to your own folder.", 403);
        }
        const mediaType = (JSON.parse(clientPayload || "{}") as { mediaType?: MediaType }).mediaType;
        if (mediaType !== "image" && mediaType !== "video") throw new MediaError("Choose an image or video.");
        return {
          allowedContentTypes: allowedTypes(mediaType),
          maximumSizeInBytes: maxBytes(mediaType),
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MediaError) return errorResponse(error);
    // handleUpload reports its own validation failures as plain errors.
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
