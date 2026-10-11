"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Slide, isUploadedMedia, mediaLabel } from "@/lib/slider";
import { fetchSlides, removeSlide } from "@/lib/sliderApi";

export default function ManageMedia() {
  const [slides, setSlides] = useState<Slide[] | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchSlides()
      .then(setSlides)
      .catch((err: Error) => {
        setSlides([]);
        setError(err.message);
      });
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Delete this media?")) return;
    try {
      await removeSlide(id);
      setSlides((current) => current?.filter((slide) => slide.id !== id) ?? null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this media.");
    }
  }

  return (
    <section className="site-container py-10">
      <p className="text-muted">Your SLIDER playlist. Admins see media from every user.</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold text-navy">Manage media</h1>
        <Link
          href="/slider/manage/new"
          className="rounded-[5px] bg-gold px-4 py-2 text-sm font-bold text-navy uppercase"
        >
          New media
        </Link>
      </div>
      {error ? (
        <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <div className="mt-6 overflow-x-auto border border-navy/10 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="px-3 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">URL</th>
              <th className="px-3 py-3 font-semibold">Duration</th>
              <th className="px-3 py-3 font-semibold">Active</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides === null ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : slides.length ? (
              slides.map((slide) => (
                <tr key={slide.id} className="border-t border-navy/10">
                  <td className="px-3 py-3 text-navy">{slide.name}</td>
                  <td className="px-3 py-3">{mediaLabel(slide)}</td>
                  <td className="px-3 py-3">{slide.ownerName}</td>
                  <td className="max-w-[280px] truncate px-3 py-3 text-muted">
                    {isUploadedMedia(slide.src) ? "Uploaded file" : slide.src}
                  </td>
                  <td className="px-3 py-3">{slide.durationSeconds}s</td>
                  <td className="px-3 py-3">{slide.isActive ? "Yes" : "No"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/slider/manage/${slide.id}`}
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
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  No media yet. Upload images or videos, or add a YouTube link or URL.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-8 max-w-3xl text-sm text-muted">
        <h2 className="font-display text-lg font-bold text-navy">Adding videos</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-navy">Have the file?</strong> Choose New media → Video upload (MP4) and drop it in.
            MP4 (H.264) or WebM, up to 250 MB.
          </li>
          <li>
            <strong className="text-navy">Already on YouTube?</strong> Choose YouTube video and paste the Share link.
            You&apos;ll see a preview before saving.
          </li>
        </ul>
        <p className="mt-3">
          Fullscreen plays every active item in this list. Sign in on the display screen with the same account.
        </p>
      </div>
    </section>
  );
}
