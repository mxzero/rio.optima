// Uploaded media files.
//
// - With BLOB_READ_WRITE_TOKEN (connect a Vercel Blob store to the project):
//   browsers upload straight to a private Blob store, which avoids Vercel's
//   4.5 MB request limit. Playback redirects to a short-lived signed URL.
// - Otherwise: files stream through the API into .data/uploads.

import crypto from "node:crypto";
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { del, head, issueSignedToken, presignUrl } from "@vercel/blob";
import { IMAGE_MAX_MB, IMAGE_TYPES, MediaType, VIDEO_MAX_MB, VIDEO_TYPES } from "@/lib/slider";
import { SetupError, UPLOAD_DIR } from "@/lib/server/store";

export class MediaError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export type UploadMode = "blob" | "direct";

export function uploadMode(): UploadMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL) {
    throw new SetupError("File uploads aren't set up yet. In Vercel, connect a Blob store to this project, then redeploy.");
  }
  return "direct";
}

export function allowedTypes(mediaType: MediaType) {
  return mediaType === "image" ? IMAGE_TYPES : mediaType === "video" ? VIDEO_TYPES : [];
}

export function maxBytes(mediaType: MediaType) {
  return (mediaType === "image" ? IMAGE_MAX_MB : VIDEO_MAX_MB) * 1024 * 1024;
}

function tooLarge(mediaType: MediaType) {
  const maxMb = mediaType === "image" ? IMAGE_MAX_MB : VIDEO_MAX_MB;
  return new MediaError(
    `File too large. Please upload ${mediaType === "image" ? "an image" : "a video"} smaller than ${maxMb} MB.`,
    413,
  );
}

// Each user may only upload under their own folder in the Blob store.
export function blobFolder(userId: string) {
  return `slider/${userId}/`;
}

// Where a slide's file lives: a local file id, or a Blob pathname.
export type MediaLocation = { localId?: string; blobPathname?: string; contentType?: string };

// ---- Local disk ----

export type DirectUpload = { contentType: string; body: ReadableStream<Uint8Array> | null };

class LimitExceeded extends Error {}

export async function saveDirectUpload(upload: DirectUpload, mediaType: MediaType): Promise<MediaLocation> {
  if (uploadMode() !== "direct") throw new MediaError("Upload files through Vercel Blob.", 400);
  if (!upload.body) throw new MediaError("The file was empty.");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const target = path.join(UPLOAD_DIR, id);
  const limit = maxBytes(mediaType);
  let size = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      size += chunk.length;
      if (size > limit) done(new LimitExceeded());
      else done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(upload.body as NodeReadableStream<Uint8Array>), counter, createWriteStream(target));
    if (size === 0) throw new MediaError("The file was empty.");
  } catch (error) {
    await fs.rm(target, { force: true });
    if (error instanceof LimitExceeded) throw tooLarge(mediaType);
    throw error;
  }
  return { localId: id, contentType: upload.contentType };
}

// ---- Vercel Blob ----

// Confirms a browser-uploaded blob belongs to this user and is an allowed file.
export async function claimBlobUpload(userId: string, pathname: string, mediaType: MediaType): Promise<MediaLocation> {
  if (!pathname.startsWith(blobFolder(userId)) || pathname.includes("..")) {
    throw new MediaError("That upload doesn't belong to your account.", 403);
  }
  const info = await head(pathname).catch(() => null);
  if (!info) throw new MediaError("The uploaded file wasn't found. Please upload it again.");
  if (!allowedTypes(mediaType).includes(info.contentType)) {
    await del(pathname).catch(() => {});
    throw new MediaError(mediaType === "image" ? "Use a JPG, PNG, GIF, or WebP image." : "Use an MP4 or WebM video.", 415);
  }
  if (info.size > maxBytes(mediaType)) {
    await del(pathname).catch(() => {});
    throw tooLarge(mediaType);
  }
  return { blobPathname: pathname, contentType: info.contentType };
}

// ---- Shared ----

export async function deleteMedia(location: MediaLocation) {
  if (location.blobPathname) await del(location.blobPathname).catch(() => {});
  if (location.localId) await fs.rm(path.join(UPLOAD_DIR, location.localId), { force: true });
}

export type OpenedMedia =
  | { redirect: string }
  | { size: number; contentType: string; stream: (start?: number, end?: number) => Readable };

export async function openMedia(location: MediaLocation): Promise<OpenedMedia | null> {
  if (location.blobPathname) {
    const validUntil = Date.now() + 60 * 60 * 1000;
    const token = await issueSignedToken({ pathname: location.blobPathname, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(token, {
      operation: "get",
      pathname: location.blobPathname,
      access: "private",
      validUntil,
    });
    return { redirect: presignedUrl };
  }
  if (!location.localId) return null;
  const file = path.join(UPLOAD_DIR, location.localId);
  const stat = await fs.stat(file).catch(() => null);
  if (!stat) return null;
  return {
    size: stat.size,
    contentType: location.contentType || "application/octet-stream",
    stream: (start, end) => createReadStream(file, { start, end }),
  };
}
