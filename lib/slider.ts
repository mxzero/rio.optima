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
  src: string;
  isActive: boolean;
};

const STORAGE_KEY = "rio-optima-slider";

export const demoSlides: Slide[] = [
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

export function youtubeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
      if (embed) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function resolvedSource(slide: Slide): string | null {
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

export function toPlayerSlide(slide: Slide) {
  const videoId = slide.mediaType === "video" ? youtubeIdFromUrl(slide.src) : null;
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

export function loadSlides(): Slide[] {
  if (typeof window === "undefined") return demoSlides;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSlides));
      return demoSlides;
    }
    const parsed = JSON.parse(raw) as Slide[];
    return Array.isArray(parsed) && parsed.length ? parsed : demoSlides;
  } catch {
    return demoSlides;
  }
}

export function saveSlides(slides: Slide[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
}

export function activePlayerSlides(slides: Slide[]) {
  return slides
    .filter((slide) => slide.isActive && isScheduledNow(slide) && resolvedSource(slide))
    .map(toPlayerSlide);
}
