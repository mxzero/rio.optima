import crypto from "node:crypto";
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { SessionUser, isAdmin } from "@/lib/auth";
import { UPLOAD_DIR, readJson, withLock, writeJson } from "@/lib/server/store";
import { listUsers } from "@/lib/server/users";
import {
  IMAGE_MAX_MB,
  IMAGE_TYPES,
  MediaType,
  Slide,
  SlideFields,
  VIDEO_MAX_MB,
  VIDEO_TYPES,
  demoSlides,
  uploadedMediaId,
  uploadedMediaRef,
  youtubeIdFromUrl,
} from "@/lib/slider";

type StoredSlide = Slide & { createdAt: string; contentType?: string };

const FILE = "slides.json";

export class SlideError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

async function seedSlides(): Promise<StoredSlide[]> {
  const admin = (await listUsers()).find((user) => user.role === "admin");
  const createdAt = new Date().toISOString();
  return demoSlides.map((slide) => ({ ...slide, ownerId: admin?.id ?? "", createdAt }));
}

const loadAll = () => readJson<StoredSlide[]>(FILE, seedSlides);

function visibleTo(user: SessionUser, slide: StoredSlide) {
  return isAdmin(user) || slide.ownerId === user.id;
}

async function withOwnerNames(slides: StoredSlide[]): Promise<Slide[]> {
  const names = new Map((await listUsers()).map((user) => [user.id, user.name]));
  return slides.map((stored) => {
    const slide: Slide & Partial<StoredSlide> = { ...stored, ownerName: names.get(stored.ownerId) ?? "Removed user" };
    delete slide.createdAt;
    delete slide.contentType;
    return slide;
  });
}

// Admins see every slide; everyone else only their own.
export async function listSlidesFor(user: SessionUser) {
  return withOwnerNames((await loadAll()).filter((slide) => visibleTo(user, slide)));
}

export async function getSlideFor(user: SessionUser, id: string) {
  const slide = (await loadAll()).find((item) => item.id === id);
  if (!slide || !visibleTo(user, slide)) throw new SlideError("Media not found.", 404);
  return (await withOwnerNames([slide]))[0];
}

export async function countSlidesByOwner() {
  const counts = new Map<string, number>();
  for (const slide of await loadAll()) counts.set(slide.ownerId, (counts.get(slide.ownerId) ?? 0) + 1);
  return counts;
}

// ---- Validation ----

const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Upload = { contentType: string; body: ReadableStream<Uint8Array> | null };

function checkFields(raw: unknown, upload: Upload | null, existing?: StoredSlide): Omit<SlideFields, "src"> & { src?: string } {
  if (!raw || typeof raw !== "object") throw new SlideError("Missing media details.");
  const input = raw as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string).trim() : "");

  const name = text("name");
  if (!name || name.length > 120) throw new SlideError("Slide name is required (up to 120 characters).");
  const durationSeconds = Number(input.durationSeconds);
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86400) {
    throw new SlideError("Duration must be a whole number of seconds, at least 1.");
  }
  const shortDescription = text("shortDescription");
  if (shortDescription.length > 255) throw new SlideError("Short description is limited to 255 characters.");
  const startDate = text("startDate");
  const endDate = text("endDate");
  if ((startDate && !DATE.test(startDate)) || (endDate && !DATE.test(endDate))) throw new SlideError("Use valid dates.");
  const orientation = input.orientation === "portrait" ? "portrait" : "landscape";
  const mediaType = input.mediaType as MediaType;
  if (!["image", "video", "url"].includes(mediaType)) throw new SlideError("Choose a media type.");
  const isActive = input.isActive !== false;
  const fields = { name, durationSeconds, shortDescription, startDate, endDate, orientation, mediaType, isActive } as const;

  if (upload) {
    const allowed = mediaType === "image" ? IMAGE_TYPES : mediaType === "video" ? VIDEO_TYPES : [];
    if (!allowed.includes(upload.contentType)) {
      throw new SlideError(
        mediaType === "image" ? "Use a JPG, PNG, GIF, or WebP image." : "Use an MP4 or WebM video.",
        415,
      );
    }
    return fields;
  }

  // No new file: keep the existing upload, or take a link.
  if (existing && uploadedMediaId(existing.src) && existing.mediaType === mediaType && !text("src")) {
    return { ...fields, src: existing.src };
  }
  const src = text("src");
  if (mediaType === "image") throw new SlideError("Upload an image file.");
  if (mediaType === "video") {
    if (!youtubeIdFromUrl(src)) throw new SlideError("That does not look like a YouTube video link.");
    return { ...fields, src };
  }
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    throw new SlideError("Enter a full web address starting with https://.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SlideError("Web page URLs must start with https:// or http://.");
  }
  return { ...fields, src: url.toString() };
}

// ---- Uploaded files ----

class TooLarge extends Error {}

async function saveUpload(upload: Upload, mediaType: MediaType) {
  if (!upload.body) throw new SlideError("The file was empty.");
  const maxMb = mediaType === "image" ? IMAGE_MAX_MB : VIDEO_MAX_MB;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const target = path.join(UPLOAD_DIR, id);
  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      size += chunk.length;
      if (size > maxMb * 1024 * 1024) done(new TooLarge());
      else done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(upload.body as NodeReadableStream<Uint8Array>), limit, createWriteStream(target));
    if (size === 0) throw new SlideError("The file was empty.");
  } catch (error) {
    await fs.rm(target, { force: true });
    if (error instanceof TooLarge) {
      throw new SlideError(`File too large. Please upload ${mediaType === "image" ? "an image" : "a video"} smaller than ${maxMb} MB.`, 413);
    }
    throw error;
  }
  return id;
}

async function removeUpload(src: string) {
  const id = uploadedMediaId(src);
  if (id) await fs.rm(path.join(UPLOAD_DIR, id), { force: true });
}

export async function openMediaFor(user: SessionUser, mediaId: string) {
  const slide = (await loadAll()).find((item) => uploadedMediaId(item.src) === mediaId);
  if (!slide || !visibleTo(user, slide)) throw new SlideError("Media not found.", 404);
  const file = path.join(UPLOAD_DIR, mediaId);
  const stat = await fs.stat(file).catch(() => null);
  if (!stat) throw new SlideError("Media not found.", 404);
  return {
    size: stat.size,
    contentType: slide.contentType || "application/octet-stream",
    stream: (start?: number, end?: number) => createReadStream(file, { start, end }),
  };
}

// ---- Create / update / delete ----

export async function createSlide(user: SessionUser, raw: unknown, upload: Upload | null) {
  const fields = checkFields(raw, upload);
  // Stream the file to disk before taking the lock so big uploads don't block others.
  const mediaId = upload ? await saveUpload(upload, fields.mediaType) : null;
  const slide: StoredSlide = {
    ...fields,
    id: crypto.randomUUID(),
    src: mediaId ? uploadedMediaRef(mediaId) : fields.src!,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
    contentType: upload?.contentType,
  };
  try {
    await withLock(async () => writeJson(FILE, [slide, ...(await loadAll())]));
  } catch (error) {
    if (mediaId) await removeUpload(slide.src);
    throw error;
  }
  return (await withOwnerNames([slide]))[0];
}

export async function updateSlide(user: SessionUser, id: string, raw: unknown, upload: Upload | null) {
  const current = (await loadAll()).find((item) => item.id === id);
  if (!current || !visibleTo(user, current)) throw new SlideError("Media not found.", 404);
  const fields = checkFields(raw, upload, current);
  const mediaId = upload ? await saveUpload(upload, fields.mediaType) : null;
  const src = mediaId ? uploadedMediaRef(mediaId) : fields.src!;
  let updated: StoredSlide | undefined;
  try {
    await withLock(async () => {
      const slides = await loadAll();
      const index = slides.findIndex((item) => item.id === id);
      if (index < 0) throw new SlideError("Media not found.", 404);
      updated = {
        ...slides[index],
        ...fields,
        src,
        contentType: mediaId ? upload!.contentType : src === slides[index].src ? slides[index].contentType : undefined,
      };
      slides[index] = updated;
      await writeJson(FILE, slides);
    });
  } catch (error) {
    if (mediaId) await removeUpload(src);
    throw error;
  }
  if (current.src !== src) await removeUpload(current.src);
  return (await withOwnerNames([updated!]))[0];
}

export async function deleteSlide(user: SessionUser, id: string) {
  const removed = await withLock(async () => {
    const slides = await loadAll();
    const slide = slides.find((item) => item.id === id);
    if (!slide || !visibleTo(user, slide)) throw new SlideError("Media not found.", 404);
    await writeJson(FILE, slides.filter((item) => item.id !== id));
    return slide;
  });
  await removeUpload(removed.src);
}
