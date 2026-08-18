"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SlidifyNav from "@/components/slidify/SlidifyNav";
import { Slide, loadSlides, saveSlides } from "@/lib/slidify";

export default function SlidifyManagePage() {
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    setSlides(loadSlides());
  }, []);

  function remove(id: string) {
    if (!window.confirm("Delete this media?")) return;
    const next = loadSlides().filter((slide) => slide.id !== id);
    saveSlides(next);
    setSlides(next);
  }

  return (
    <div>
      <SlidifyNav />
      <section className="site-container py-10">
        <p className="text-muted">Playlist stored on this browser for the Rio Optima Slidify service.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-extrabold text-navy">Manage media</h1>
          <Link
            href="/slidify/manage/new"
            className="rounded-[5px] bg-gold px-4 py-2 text-sm font-bold text-navy uppercase"
          >
            New media
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto border border-navy/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">URL</th>
                <th className="px-3 py-3 font-semibold">Duration</th>
                <th className="px-3 py-3 font-semibold">Active</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.length ? (
                slides.map((slide) => (
                  <tr key={slide.id} className="border-t border-navy/10">
                    <td className="px-3 py-3 text-navy">{slide.name}</td>
                    <td className="px-3 py-3">{slide.mediaType}</td>
                    <td className="max-w-[280px] truncate px-3 py-3 text-muted">
                      {slide.src.startsWith("data:") ? "Uploaded image" : slide.src}
                    </td>
                    <td className="px-3 py-3">{slide.durationSeconds}s</td>
                    <td className="px-3 py-3">{slide.isActive ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/slidify/manage/${slide.id}`}
                          className="rounded-[5px] bg-navy px-3 py-1.5 text-xs font-bold text-white uppercase"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(slide.id)}
                          className="rounded-[5px] bg-teal px-3 py-1.5 text-xs font-bold text-white uppercase"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    No media yet. Add an image, YouTube video, or URL.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-8 max-w-3xl text-sm text-muted">
          <h2 className="font-display text-lg font-bold text-navy">How to add a YouTube video</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Sign in to YouTube and upload your video (or open one you already own).</li>
            <li>Wait until processing finishes, then click Share.</li>
            <li>Copy the watch or share URL and paste it in New media with type Video.</li>
          </ol>
          <p className="mt-3">
            <strong className="text-navy">Slidify hosts the slider, not the video.</strong> Playback loads from YouTube.
          </p>
        </div>
      </section>
    </div>
  );
}
