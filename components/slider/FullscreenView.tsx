"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Player, { PlayerSlide } from "@/components/slider/Player";
import { Slide, activePlayerSlides } from "@/lib/slider";
import { fetchSlides } from "@/lib/sliderApi";

const REFRESH_MS = 5 * 60 * 1000;
const noop = () => () => {};

type Props =
  // Signed-in player: loads the viewer's playlist from the API.
  | { publicKey?: never; slides?: never }
  // Public link: slides come from the server; uploaded files are fetched with
  // the link's key instead of a login.
  | { publicKey: string; slides: Slide[] };

export default function FullscreenView({ publicKey, slides: given }: Props) {
  const router = useRouter();
  const [fetched, setFetched] = useState<Slide[]>([]);
  // Schedules depend on the screen's local date, so only filter in the browser.
  const isClient = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (publicKey) {
      // Pick up playlist edits, and redirect away if the account is deactivated.
      const timer = window.setInterval(() => router.refresh(), REFRESH_MS);
      return () => window.clearInterval(timer);
    }
    fetchSlides()
      .then(setFetched)
      .catch(() => setFetched([]));
  }, [publicKey, router]);

  const slides = useMemo<PlayerSlide[]>(() => {
    if (!isClient) return [];
    const playable = activePlayerSlides(given ?? fetched);
    if (!publicKey) return playable;
    const param = `player=${encodeURIComponent(publicKey)}`;
    return playable.map((slide) =>
      slide.src?.startsWith("/api/slider/media/") ? { ...slide, src: `${slide.src}?${param}` } : slide,
    );
  }, [isClient, given, fetched, publicKey]);

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      {publicKey ? null : (
        <>
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
        </>
      )}
      {isClient ? <Player slides={slides} fill className="h-full" /> : null}
    </div>
  );
}
