"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Player, { PlayerSlide } from "@/components/slider/Player";
import { tvLabel } from "@/lib/auth";
import { Slide, activePlayerSlides } from "@/lib/slider";
import { fetchSlides } from "@/lib/sliderApi";

const REFRESH_MS = 60 * 60 * 1000;
const CONTROLS_MS = 3000;
const noop = () => () => {};

// crypto.randomUUID only exists on https and localhost; TVs may open the
// player over plain http on the local network.
function newInstanceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

type Props =
  // Signed-in player: loads the viewer's playlist from the API.
  | { screen?: never; slides?: never }
  // A TV signed in at /sfs/<code>: slides come from the server, and uploaded
  // files load with the TV's cookie.
  | { screen: { tv: number; heartbeatSeconds: number }; slides: Slide[] };

export default function FullscreenView({ screen, slides: given }: Props) {
  const router = useRouter();
  const [fetched, setFetched] = useState<Slide[]>([]);
  // Schedules depend on the screen's local date, so only filter in the browser.
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const heartbeatSeconds = screen?.heartbeatSeconds;
  // Identifies this page load to the server, so a closing page's release can't
  // free the slot that its reload has already picked up.
  const [instance] = useState(newInstanceId);

  useEffect(() => {
    if (!heartbeatSeconds) {
      fetchSlides()
        .then(setFetched)
        .catch(() => setFetched([]));
      return;
    }
    // Pick up playlist edits once an hour. (A deactivated account or lost slot
    // shows up sooner, at the next check-in.)
    const refresh = window.setInterval(() => router.refresh(), REFRESH_MS);
    // Keep this TV's slot. If it was lost (say another screen took the TV
    // number while this one was offline), re-render to show the sign-in and
    // why. Network errors are ignored: the next check-in tries again.
    const checkIn = () => {
      fetch("/api/sfs/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance }),
      })
        .then((response) => {
          if (!response.ok && response.status < 500) router.refresh();
        })
        .catch(() => {});
    };
    checkIn();
    const heartbeat = window.setInterval(checkIn, heartbeatSeconds * 1000);
    // Hidden tabs check in late; check at once when shown again.
    const onVisible = () => {
      if (document.visibilityState === "visible") checkIn();
    };
    // Back from the browser's back/forward cache after a release: take it back.
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) checkIn();
    };
    // Closing the tab, window or browser frees this TV number right away.
    const onHide = () => {
      const body = JSON.stringify({ instance });
      if (!navigator.sendBeacon?.("/api/sfs/release", body)) {
        fetch("/api/sfs/release", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("pagehide", onHide);
    };
  }, [heartbeatSeconds, instance, router]);

  const slides = useMemo<PlayerSlide[]>(
    () => (isClient ? activePlayerSlides(given ?? fetched) : []),
    [isClient, given, fetched],
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      {screen ? (
        <TvControls tv={screen.tv} />
      ) : (
        <>
          <Link
            href="/slider"
            title="Back to SLIDER"
            aria-label="Back to SLIDER"
            className="absolute top-2 left-2 z-20 grid h-[22px] w-[22px] place-items-center rounded-[4px] bg-gold/50 text-navy"
          >
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" aria-hidden="true">
              <path fill="currentColor" d="M12 3.2 3 12h2.5v8h5v-5h3v5h5v-8H21z" />
            </svg>
          </Link>
          <p className="absolute top-2.5 left-9 z-20 m-0 text-[10px] text-white [text-shadow:0_1px_4px_#000]">
            toggle F11 (fullscreen)
          </p>
        </>
      )}
      {isClient ? <Player slides={slides} fill className="h-full" /> : null}
    </div>
  );
}

// Hidden while playing; moving the mouse (or a TV remote's pointer) shows which
// TV this is and an OFF button, which frees its TV number for another screen
// and goes back to the sign-in (TV 1, no password).
function TvControls({ tv }: { tv: number }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const hideTimer = useRef(0);

  useEffect(() => {
    function show() {
      setVisible(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), CONTROLS_MS);
    }
    window.addEventListener("pointermove", show);
    window.addEventListener("keydown", show);
    return () => {
      window.removeEventListener("pointermove", show);
      window.removeEventListener("keydown", show);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  async function turnOff() {
    setLeaving(true);
    await fetch("/api/sfs/logout", { method: "POST" }).catch(() => {});
    router.refresh();
  }

  return (
    <div
      className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 transition-opacity ${visible || leaving ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <span className="rounded-[4px] bg-navy/50 px-1.5 py-0.5 text-[10px] font-bold text-white">{tvLabel(tv)}</span>
      <button
        type="button"
        onClick={turnOff}
        disabled={leaving}
        title="Turn off this TV and free its number"
        className="flex rounded-[4px] bg-gold/50 px-1.5 py-0.5 font-bold text-navy disabled:opacity-60"
      >
        {/* Sized on a span: the global button rule (font: inherit) outranks
            text utilities on the button itself. */}
        <span className="text-[10px]">{leaving ? "Turning off…" : "OFF"}</span>
      </button>
    </div>
  );
}
