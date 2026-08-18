"use client";

import { useEffect, useState } from "react";
import Player from "@/components/slidify/Player";
import SlidifyNav from "@/components/slidify/SlidifyNav";
import { activePlayerSlides, loadSlides } from "@/lib/slidify";

export default function SlidifyHomePage() {
  const [slides, setSlides] = useState(activePlayerSlides([]));

  useEffect(() => {
    setSlides(activePlayerSlides(loadSlides()));
  }, []);

  return (
    <div className="bg-paper">
      <SlidifyNav />
      <section className="site-container grid gap-8 py-10">
        <div>
          <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">
            Image and video display
          </p>
          <h1 className="font-display mt-2 text-4xl font-extrabold text-navy">
            Play images, videos, and URLs on any screen.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Slidify is a Rio Optima application. Build a playlist, then open
            Fullscreen on a lobby, operations, or shop-floor display.
          </p>
        </div>
        <Player slides={slides} caption className="border border-navy/10" />
      </section>
    </div>
  );
}
