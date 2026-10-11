import type { PlayerSlide } from "@/components/slider/Player";

export type MediaType = "image" | "video" | "url";
export type Orientation = "landscape" | "portrait";

export type Slide = {
  id: string;
  name: string;
  durationSeconds: number;
  shortDescription: string;
  startDate: string;
  endDate: string;
  orientation: Orientation;
  mediaType: MediaType;
  // "media:<id>" for files uploaded to the server; otherwise a URL.
  src: string;
  isActive: boolean;
  ownerId: string;
  ownerName?: string;
};

// The editable fields a client sends when creating or updating a slide.
export type SlideFields = Pick<
  Slide,
  "name" | "durationSeconds" | "shortDescription" | "startDate" | "endDate" | "orientation" | "mediaType" | "isActive"
> & { src?: string; blobPathname?: string };

const MEDIA_PREFIX = "media:";

export function isUploadedMedia(src: string) {
  return src.startsWith(MEDIA_PREFIX);
}

export function uploadedMediaId(src: string) {
  return isUploadedMedia(src) ? src.slice(MEDIA_PREFIX.length) : null;
}

export function uploadedMediaRef(id: string) {
  return MEDIA_PREFIX + id;
}

export const demoSlides: Omit<Slide, "ownerId">[] = [
  {
    id: "demo-1",
    name: "Lobby welcome",
    durationSeconds: 8,
    shortDescription: "Corporate digital signage for reception and common areas.",
    startDate: "2026-01-01",
    endDate: "",
    orientation: "landscape",
    mediaType: "image",
    src: "/images/slidify-signage.png",
    isActive: true,
  },
  {
    id: "demo-2",
    name: "Delivery brief",
    durationSeconds: 8,
    shortDescription: "Keep program status visible to stakeholders.",
    startDate: "2026-01-01",
    endDate: "",
    orientation: "landscape",
    mediaType: "image",
    src: "/images/project-delivery.png",
    isActive: true,
  },
  {
    id: "demo-3",
    name: "Technical review",
    durationSeconds: 8,
    shortDescription: "Blueprints, systems, and architecture on screen.",
    startDate: "2026-01-01",
    endDate: "",
    orientation: "landscape",
    mediaType: "image",
    src: "/images/technical-architecture.png",
    isActive: true,
  },
];

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeIdFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = parsed.pathname.split("/")[1] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      parsed.searchParams.get("v") ||
      parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ||
      null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function isYoutubeSlide(slide: Pick<Slide, "mediaType" | "src">) {
  return slide.mediaType === "video" && !isUploadedMedia(slide.src);
}

export function mediaLabel(slide: Slide) {
  if (slide.mediaType === "url") return "Web page";
  if (slide.mediaType === "image") return "Image";
  return isYoutubeSlide(slide) ? "YouTube" : "Video file";
}

export function resolvedSource(slide: Slide): string | null {
  const mediaId = uploadedMediaId(slide.src);
  if (mediaId) return `/api/slider/media/${mediaId}`;
  if (slide.mediaType === "video") {
    const id = youtubeIdFromUrl(slide.src);
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&playsinline=1`;
  }
  return slide.src || null;
}

export function isScheduledNow(slide: Slide, today = new Date()): boolean {
  const iso = today.toISOString().slice(0, 10);
  if (slide.startDate && slide.startDate > iso) return false;
  if (slide.endDate && slide.endDate < iso) return false;
  return true;
}

export function toPlayerSlide(slide: Slide): PlayerSlide {
  const videoId = isYoutubeSlide(slide) ? youtubeIdFromUrl(slide.src) : null;
  return {
    id: slide.id,
    name: slide.name,
    duration: slide.durationSeconds * 1000,
    description: slide.shortDescription,
    mediaType: videoId ? "youtube" : slide.mediaType,
    orientation: slide.orientation,
    src: resolvedSource(slide),
    embed: videoId ? "youtube" : "",
  };
}

export function activePlayerSlides(slides: Slide[]) {
  return slides
    .filter((slide) => slide.isActive && isScheduledNow(slide) && resolvedSource(slide))
    .map(toPlayerSlide);
}

// ---- Upload validation ----

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const IMAGE_MAX_MB = 15;
export const VIDEO_MAX_MB = 250;

export type CheckedFile =
  | { ok: true; kind: "image" | "video"; durationSeconds?: number }
  | { ok: false; title: string; reason: string };

export async function checkMediaFile(file: File, expect: "image" | "video"): Promise<CheckedFile> {
  const allowed = expect === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  const maxMb = expect === "image" ? IMAGE_MAX_MB : VIDEO_MAX_MB;
  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      title: "Unsupported format",
      reason:
        expect === "image"
          ? "Use a JPG, PNG, GIF, or WebP image."
          : "Use an MP4 or WebM video. Convert other formats (MOV, AVI, MKV) to MP4 first.",
    };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return {
      ok: false,
      title: "File too large",
      reason: `This file is ${formatBytes(file.size)}. Please upload ${expect === "image" ? "an image" : "a video"} smaller than ${maxMb} MB.`,
    };
  }
  if (expect === "image") {
    return (await canDecodeImage(file))
      ? { ok: true, kind: "image" }
      : { ok: false, title: "Unable to read image", reason: "The file looks damaged or is not a real image." };
  }
  const probe = await probeVideo(file);
  if (probe === null) {
    return {
      ok: false,
      title: "Unable to play video",
      reason: "This browser can't play this video. Convert it to MP4 (H.264 video, AAC audio) and try again.",
    };
  }
  return { ok: true, kind: "video", durationSeconds: probe.duration };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canDecodeImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

// Resolves with the video length in seconds (if the file reports one), or null
// if the browser can't play it.
function probeVideo(file: File): Promise<{ duration?: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const finish = (value: { duration?: number } | null) => {
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), 15000);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () =>
      finish(
        video.videoWidth > 0
          ? { duration: Number.isFinite(video.duration) ? video.duration : undefined }
          : null,
      );
    video.onerror = () => finish(null);
    video.src = url;
  });
}

