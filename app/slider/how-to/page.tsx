import type { Metadata } from "next";
import SliderNav from "@/components/slider/SliderNav";

export const metadata: Metadata = {
  title: "SLIDER — How to",
};

export default function SliderHowToPage() {
  return (
    <div>
      <SliderNav />
      <section className="site-container py-10">
        <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">How to</p>
        <h1 className="font-display mt-2 text-4xl font-extrabold text-navy">Use SLIDER</h1>
        <p className="mt-3 max-w-2xl text-muted">
          SLIDER plays a playlist of images, videos, YouTube links, and web pages. You manage the playlist; the fullscreen player loops it.
        </p>
        <div className="mt-8 max-w-3xl space-y-6 border border-navy/10 bg-white p-6">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">1. Log in and open the app</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Log in, then open Manage to add media. Admins create accounts in the Admin console.</li>
              <li>Open Fullscreen on the TV or lobby screen.</li>
            </ol>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy">2. Build the playlist</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Click New media.</li>
              <li>For photos, choose Image upload and drop in one or more files (JPG, PNG, GIF, WebP, up to 15 MB each).</li>
              <li>For videos, choose Video upload (MP4) and drop in MP4 or WebM files up to 250 MB. Or choose YouTube video and paste a share link.</li>
              <li>Each file is checked first. Files that are too large or in a format the browser can&apos;t play are flagged with the reason, and the rest still upload.</li>
              <li>Uploaded files are stored on the server. Each user sees and plays their own media; admins see everyone&apos;s.</li>
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
