import Image from "next/image";
import Link from "next/link";

export default function SliderOverview() {
  return (
    <section className="site-container grid gap-10 py-12">
      <div className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">
          Rio Optima application
        </p>
        <h1 className="font-display mt-2 text-4xl font-extrabold text-navy md:text-5xl">
          SLIDER
        </h1>
        <hr className="gold-rule mt-5" />
        <p className="mt-5 text-lg leading-8 text-muted">
          SLIDER plays a looping playlist of images, videos, YouTube links, and web
          pages on lobby, warehouse, command-center, and shop-floor screens.
          One playlist. Any display. No dedicated operator standing by the TV.
        </p>
      </div>

      <div className="relative aspect-video overflow-hidden border border-navy/10">
        <Image
          src="/images/slidify-signage.png"
          alt="SLIDER on a lobby display"
          fill
          className="object-cover"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          ["Build a playlist", "Upload photos and MP4 videos, or add YouTube links and live web pages. Set duration, orientation, and schedule."],
          ["Play it fullscreen", "Open the player on a TV or lobby screen. Active items loop automatically."],
          ["Keep it current", "Log in to swap media when a campaign, safety notice, or status board needs to change."],
        ].map(([title, copy]) => (
          <article key={title} className="border-t-4 border-teal bg-white p-6">
            <h2 className="font-display text-xl font-bold text-navy">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/login?next=/slider"
          className="rounded-[5px] bg-gold px-6 py-3 text-sm font-bold text-navy uppercase"
        >
          Log in to manage
        </Link>
        <Link
          href="/slider/how-to"
          className="rounded-[5px] bg-navy px-6 py-3 text-sm font-bold text-white uppercase"
        >
          How SLIDER works
        </Link>
      </div>
    </section>
  );
}
