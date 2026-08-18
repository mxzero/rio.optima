import type { Metadata } from "next";
import SlidifyNav from "@/components/slidify/SlidifyNav";

export const metadata: Metadata = {
  title: "Slidify — How to",
};

export default function SlidifyHowToPage() {
  return (
    <div>
      <SlidifyNav />
      <section className="site-container py-10">
        <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">How to</p>
        <h1 className="font-display mt-2 text-4xl font-extrabold text-navy">Use Slidify</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Slidify plays a playlist of images, YouTube videos, and web pages. You manage the playlist; the fullscreen player loops it.
        </p>
        <div className="mt-8 max-w-3xl space-y-6 border border-navy/10 bg-white p-6">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">1. Request access and open the app</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Request Slidify from Contact Us, then open Manage to add media.</li>
              <li>Open Fullscreen on the TV or lobby screen.</li>
            </ol>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy">2. Build the playlist</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Click New media.</li>
              <li>For a photo, upload an image file. Keep files reasonably small so screens refresh quickly.</li>
              <li>For a video, paste a YouTube watch or share URL. Slidify does not host video files.</li>
              <li>For a web page, set the type to URL and paste an https link.</li>
              <li>Set duration so each slide is readable. Turn Active off to keep an item without playing it.</li>
            </ol>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy">3. Play it</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Open Fullscreen on the display. It loops every active, in-date item.</li>
              <li>If a YouTube slide is blank, the video is private, deleted, still processing, or blocked in that region.</li>
              <li>Only use media you own or have permission to show on a public screen.</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
