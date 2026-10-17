import crypto from "node:crypto";
import { ALL_TV, SessionUser, canUseSlider, isAdmin, parsePlayerKey } from "@/lib/auth";
import {
  DirectUpload,
  MediaError,
  MediaLocation,
  allowedTypes,
  claimBlobUpload,
  deleteMedia,
  openMedia,
  saveDirectUpload,
} from "@/lib/server/media";
import { collection } from "@/lib/server/store";
import { findUserById, findUserByShortId, findUserByTvCode, listUsers } from "@/lib/server/users";
import { MediaType, Slide, demoSlides, uploadedMediaId, uploadedMediaRef, youtubeIdFromUrl } from "@/lib/slider";

// Slides saved before ordering existed have no `order` (they play after the
// ordered ones, newest first) and no `tvNumber`, or null from when "All" was a
// separate choice; both mean TV 1 (All).
type StoredSlide = Omit<Slide, "order" | "tvNumber" | "ownerName" | "ownerTvs"> & {
  order?: number;
  tvNumber?: number | null;
  createdAt: string;
  media?: MediaLocation;
};

const slides = collection<StoredSlide>("slides", async () => {
  const admin = (await listUsers()).find((user) => user.role === "admin");
  const now = Date.now();
  return demoSlides.map((slide, index) => ({
    ...slide,
    order: index + 1,
    tvNumber: ALL_TV,
    ownerId: admin?.id ?? "",
    createdAt: new Date(now - index * 1000).toISOString(),
  }));
});

function playOrder(a: StoredSlide, b: StoredSlide) {
  const byOrder = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
  return byOrder || b.createdAt.localeCompare(a.createdAt);
}

// One owner's slides in play order.
function playlistOf(all: Iterable<StoredSlide>, ownerId: string) {
  return [...all].filter((slide) => slide.ownerId === ownerId).sort(playOrder);
}

// Saves a playlist's positions as 1, 2, 3… so gaps and unordered slides settle.
function renumber(records: Record<string, StoredSlide>, playlist: StoredSlide[]) {
  playlist.forEach((slide, index) => {
    records[slide.id] = { ...records[slide.id], order: index + 1 };
  });
}

function visibleTo(user: SessionUser, slide: StoredSlide) {
  return isAdmin(user) || slide.ownerId === user.id;
}

async function withOwnerNames(list: StoredSlide[]): Promise<Slide[]> {
  const owners = new Map((await listUsers()).map((user) => [user.id, user]));
  const all = await slides.list();
  const positions = new Map<string, number>();
  for (const ownerId of new Set(list.map((slide) => slide.ownerId))) {
    playlistOf(all, ownerId).forEach((slide, index) => positions.set(slide.id, index + 1));
  }
  return list.map((stored) => {
    const owner = owners.get(stored.ownerId);
    const slide: Slide & Partial<Pick<StoredSlide, "createdAt" | "media">> = {
      ...stored,
      order: positions.get(stored.id) ?? stored.order ?? 1,
      tvNumber: stored.tvNumber ?? ALL_TV,
      ownerName: owner?.name ?? "Removed user",
      ownerTvs: owner?.totalTvs ?? 1,
    };
    delete slide.createdAt;
    delete slide.media;
    return slide;
  });
}

async function findVisible(user: SessionUser, id: string) {
  const slide = await slides.get(id);
  if (!slide || !visibleTo(user, slide)) throw new MediaError("Media not found.", 404);
  return slide;
}

// The user behind a public player link, if that account may play SLIDER:
// it exists, is active, and has the Slider service (or is an admin).
export async function findPlayerOwner(key: string) {
  const parsed = parsePlayerKey(key);
  const user = !parsed
    ? null
    : "tvCode" in parsed
      ? await findUserByTvCode(parsed.tvCode)
      : "shortId" in parsed
        ? await findUserByShortId(parsed.shortId)
        : await findUserById(parsed.id);
  return canUseSlider(user) ? user : null;
}

// Admins see every slide (their own first, then by owner); everyone else only
// their own. Each owner's slides are in play order.
export async function listSlidesFor(user: SessionUser) {
  const list = await withOwnerNames((await slides.list()).filter((slide) => visibleTo(user, slide)));
  return list.sort(
    (a, b) =>
      Number(a.ownerId !== user.id) - Number(b.ownerId !== user.id) ||
      (a.ownerName ?? "").localeCompare(b.ownerName ?? "") ||
      a.ownerId.localeCompare(b.ownerId) ||
      a.order - b.order,
  );
}

// What one of the owner's TVs plays: their own slides in order. TV 1 (All)
// plays every slide; another TV plays the slides set to its number plus the
// ones set to TV 1 (All).
export async function listTvPlaylist(owner: SessionUser, tv: number) {
  const playlist = playlistOf(await slides.list(), owner.id).filter((slide) => {
    const slideTv = slide.tvNumber ?? ALL_TV;
    return tv === ALL_TV || slideTv === ALL_TV || slideTv === tv;
  });
  return withOwnerNames(playlist);
}

export async function getSlideFor(user: SessionUser, id: string) {
  return (await withOwnerNames([await findVisible(user, id)]))[0];
}

export async function countSlidesByOwner() {
  const counts = new Map<string, number>();
  for (const slide of await slides.list()) counts.set(slide.ownerId, (counts.get(slide.ownerId) ?? 0) + 1);
  return counts;
}

// ---- Validation ----

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function checkFields(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new MediaError("Missing media details.");
  const input = raw as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string).trim() : "");

  const name = text("name");
  if (!name || name.length > 120) throw new MediaError("Slide name is required (up to 120 characters).");
  const durationSeconds = Number(input.durationSeconds);
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86400) {
    throw new MediaError("Duration must be a whole number of seconds, at least 1.");
  }
  const shortDescription = text("shortDescription");
  if (shortDescription.length > 255) throw new MediaError("Short description is limited to 255 characters.");
  const startDate = text("startDate");
  const endDate = text("endDate");
  if ((startDate && !DATE.test(startDate)) || (endDate && !DATE.test(endDate))) throw new MediaError("Use valid dates.");
  const mediaType = input.mediaType as MediaType;
  if (!["image", "video", "url"].includes(mediaType)) throw new MediaError("Choose a media type.");

  return {
    fields: {
      name,
      durationSeconds,
      shortDescription,
      startDate,
      endDate,
      orientation: input.orientation === "portrait" ? ("portrait" as const) : ("landscape" as const),
      mediaType,
      isActive: input.isActive !== false,
    },
    src: text("src"),
    blobPathname: text("blobPathname"),
  };
}

function checkLink(mediaType: MediaType, src: string) {
  if (mediaType === "image") throw new MediaError("Upload an image file.");
  if (mediaType === "video") {
    if (!youtubeIdFromUrl(src)) throw new MediaError("That does not look like a YouTube video link.");
    return src;
  }
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    throw new MediaError("Enter a full web address starting with https://.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new MediaError("Web page URLs must start with https:// or http://.");
  }
  return url.toString();
}

// Works out the slide's new source: a fresh upload (streamed or already in
// Blob), the existing upload, or a link.
async function resolveSource(
  user: SessionUser,
  checked: ReturnType<typeof checkFields>,
  direct: DirectUpload | null,
  existing?: StoredSlide,
): Promise<{ src: string; media?: MediaLocation; isNew: boolean }> {
  const { mediaType } = checked.fields;
  if (direct) {
    if (!allowedTypes(mediaType).includes(direct.contentType)) {
      throw new MediaError(mediaType === "image" ? "Use a JPG, PNG, GIF, or WebP image." : "Use an MP4 or WebM video.", 415);
    }
    const media = await saveDirectUpload(direct, mediaType);
    return { src: uploadedMediaRef(media.localId!), media, isNew: true };
  }
  if (checked.blobPathname) {
    const media = await claimBlobUpload(user.id, checked.blobPathname, mediaType);
    return { src: uploadedMediaRef(crypto.randomUUID()), media, isNew: true };
  }
  if (existing?.media && existing.mediaType === mediaType && !checked.src) {
    return { src: existing.src, media: existing.media, isNew: false };
  }
  return { src: checkLink(mediaType, checked.src), isNew: false };
}

// ---- Create / update / delete ----

// New slides go to the end of the playlist, on TV 1 (All).
export async function createSlide(user: SessionUser, raw: unknown, direct: DirectUpload | null) {
  const checked = checkFields(raw);
  const source = await resolveSource(user, checked, direct);
  const slide: StoredSlide = {
    ...checked.fields,
    id: crypto.randomUUID(),
    src: source.src,
    media: source.media,
    tvNumber: ALL_TV,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
  };
  try {
    await slides.update((records) => {
      const playlist = playlistOf(Object.values(records), user.id);
      renumber(records, playlist);
      records[slide.id] = { ...slide, order: playlist.length + 1 };
    });
  } catch (error) {
    if (source.media) await deleteMedia(source.media);
    throw error;
  }
  return (await withOwnerNames([slide]))[0];
}

export async function updateSlide(user: SessionUser, id: string, raw: unknown, direct: DirectUpload | null) {
  const current = await findVisible(user, id);
  const checked = checkFields(raw);
  const source = await resolveSource(user, checked, direct, current);
  const updated: StoredSlide = { ...current, ...checked.fields, src: source.src, media: source.media };
  try {
    await slides.put(updated);
  } catch (error) {
    if (source.isNew && source.media) await deleteMedia(source.media);
    throw error;
  }
  if (current.media && current.src !== updated.src) await deleteMedia(current.media);
  return (await withOwnerNames([updated]))[0];
}

// Moves a slide within its owner's playlist and/or sets which TV plays it, from
// the dropdowns in the media table.
export async function placeSlide(user: SessionUser, id: string, raw: unknown) {
  const current = await findVisible(user, id);
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  let tvNumber: number | undefined;
  if (input.tvNumber !== undefined) {
    const ownerTvs = (await findUserById(current.ownerId))?.totalTvs ?? 1;
    tvNumber = Number(input.tvNumber);
    if (!Number.isInteger(tvNumber) || tvNumber < 1 || tvNumber > ownerTvs) {
      throw new MediaError(`Choose a TV from 1 to ${ownerTvs}.`);
    }
  }
  let order: number | undefined;
  if (input.order !== undefined) {
    order = Number(input.order);
    if (!Number.isInteger(order) || order < 1) throw new MediaError("Choose a position in the playlist.");
  }

  await slides.update((records) => {
    if (!records[id]) return;
    if (tvNumber !== undefined) records[id] = { ...records[id], tvNumber };
    const playlist = playlistOf(Object.values(records), current.ownerId);
    if (order !== undefined) {
      const [moving] = playlist.splice(
        playlist.findIndex((slide) => slide.id === id),
        1,
      );
      playlist.splice(Math.min(order, playlist.length + 1) - 1, 0, moving);
    }
    renumber(records, playlist);
  });
  return getSlideFor(user, id);
}

export async function deleteSlide(user: SessionUser, id: string) {
  const slide = await findVisible(user, id);
  await slides.remove(id);
  if (slide.media) await deleteMedia(slide.media);
}

export async function openMediaFor(user: SessionUser, mediaId: string) {
  const slide = (await slides.list()).find((item) => uploadedMediaId(item.src) === mediaId);
  if (!slide?.media || !visibleTo(user, slide)) throw new MediaError("Media not found.", 404);
  const media = await openMedia(slide.media);
  if (!media) throw new MediaError("Media not found.", 404);
  return media;
}
