"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Player, { PlayerSlide } from "@/components/slider/Player";
import { activePlayerSlides } from "@/lib/slider";
import { fetchSlides } from "@/lib/sliderApi";

export default function FullscreenPage() {
  const [slides, setSlides] = useState<PlayerSlide[]>([]);

  useEffect(() => {
    fetchSlides()
      .then((all) => setSlides(activePlayerSlides(all)))
      .catch(() => setSlides([]));
  }, []);

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      <Link
        href="/slider"
        title="Back to SLIDER"
        aria-label="Back to SLIDER"
        className="absolute top-2.5 left-2.5 z-20 grid h-[30px] w-[30px] place-items-center rounded-[5px] bg-gold text-navy"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
          <path fill="currentColor" d="M12 3.2 3 12h2.5v8h5v-5h3v5h5v-8H21z" />
        </svg>
      </Link>
      <p className="absolute top-3.5 left-12 z-20 m-0 text-xs text-white [text-shadow:0_1px_4px_#000]">
        toggle F11 (fullscreen)
      </p>
      <Player slides={slides} fill className="h-full" />
    </div>
  );
}
