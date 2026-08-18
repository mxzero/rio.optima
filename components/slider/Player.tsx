"use client";

import { useEffect, useState } from "react";

export type PlayerSlide = {
  id: string;
  name: string;
  duration: number;
  description: string;
  mediaType: string;
  orientation: string;
  src: string | null;
  embed: string;
};

export default function Player({
  slides,
  caption = false,
  className = "",
  fill = false,
}: {
  slides: PlayerSlide[];
  caption?: boolean;
  className?: string;
  fill?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    if (!slides.length) return;
    const duration = slides[index]?.duration || 8000;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [index, slides]);

  if (!slides.length || !slide) {
    return (
      <div className={`grid min-h-[280px] place-items-center bg-navy text-white ${className}`}>
        <div className="p-8 text-center">
          <h2 className="font-display text-2xl font-bold">No active media</h2>
          <p className="mt-2 text-white/70">Add images, YouTube videos, or URLs from Manage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-black ${fill ? "h-full" : ""} ${className}`}>
      <div
        className={`relative mx-auto bg-black ${
          fill
            ? "h-full w-full"
            : slide.orientation === "portrait"
              ? "aspect-[9/16] w-full max-w-[420px]"
              : "aspect-video w-full"
        }`}
      >
        {slide.embed === "youtube" || slide.mediaType === "youtube" || slide.mediaType === "url" ? (
          <iframe
            key={slide.id + String(index)}
            src={slide.src || ""}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={slide.name}
          />
        ) : slide.mediaType === "video" ? (
          <video
            key={slide.id + String(index)}
            src={slide.src || ""}
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.id + String(index)}
            src={slide.src || ""}
            alt={slide.name}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>
      {caption ? (
        <div className="bg-navy px-5 py-4 text-white">
          <h2 className="font-display text-lg font-bold">{slide.name}</h2>
          {slide.description ? (
            <p className="mt-1 text-sm text-white/75">{slide.description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
