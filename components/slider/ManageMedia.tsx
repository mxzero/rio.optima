"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlayerLink from "@/components/slider/PlayerLink";
import { tvLabel } from "@/lib/auth";
import { Slide, isUploadedMedia, mediaLabel } from "@/lib/slider";
import { fetchSlides, placeSlide, removeSlide } from "@/lib/sliderApi";

const COLUMNS = 9;
const cellSelect = "rounded-[5px] border border-navy/20 bg-white px-2 py-1 disabled:opacity-60";

const range = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

export default function ManageMedia() {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSlides()
      .then(setSlides)
      .catch((err: Error) => {
        setSlides([]);
        setError(err.message);
      });
  }, []);

  // Order choices run 1…n within each owner's playlist.
  const playlistSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    for (const slide of slides ?? []) sizes.set(slide.ownerId, (sizes.get(slide.ownerId) ?? 0) + 1);
    return sizes;
  }, [slides]);

  async function remove(id: string) {
    if (!window.confirm("Delete this media?")) return;
    try {
      await removeSlide(id);
      setSlides(await fetchSlides());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this media.");
    }
  }

  // Moving one slide renumbers the rest, so reload the list afterwards.
  async function place(id: string, placement: { order?: number; tvNumber?: number }) {
    setBusyId(id);
    try {
      await placeSlide(id, placement);
      setSlides(await fetchSlides());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this media.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="site-container py-10">
      <p className="text-muted">Your SLIDER playlist. Admins see media from every user.</p>
      <h1 className="font-display mt-4 text-3xl font-extrabold text-navy">Manage media</h1>
      <PlayerLink />
      {error ? (
        <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <div className="mt-6 overflow-x-auto border border-navy/10 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="px-3 py-3 font-semibold">Order</th>
              <th className="px-3 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">URL</th>
              <th className="px-3 py-3 font-semibold">Duration</th>
              <th className="px-3 py-3 font-semibold">TV number</th>
              <th className="px-3 py-3 font-semibold">Active</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides === null ? (
              <tr>
                <td colSpan={COLUMNS} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : slides.length ? (
              slides.map((slide) => {
                const ownerTvs = slide.ownerTvs ?? 1;
                const busy = busyId !== "";
                return (
                  <tr key={slide.id} className="border-t border-navy/10">
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Order of ${slide.name}`}
                        value={slide.order}
                        disabled={busy}
                        onChange={(event) => place(slide.id, { order: Number(event.target.value) })}
                        className={cellSelect}
                      >
                        {range(playlistSizes.get(slide.ownerId) ?? 1).map((position) => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-navy">{slide.name}</td>
                    <td className="px-3 py-3">{mediaLabel(slide)}</td>
                    <td className="px-3 py-3">{slide.ownerName}</td>
                    <td className="max-w-[240px] truncate px-3 py-3 text-muted">
                      {isUploadedMedia(slide.src) ? "Uploaded file" : slide.src}
                    </td>
                    <td className="px-3 py-3">{slide.durationSeconds}s</td>
                    <td className="px-3 py-3">
                      <select
                        aria-label={`TV number for ${slide.name}`}
                        value={slide.tvNumber}
                        disabled={busy}
                        onChange={(event) => place(slide.id, { tvNumber: Number(event.target.value) })}
                        className={cellSelect}
                      >
                        {range(ownerTvs).map((tv) => (
                          <option key={tv} value={tv}>
                            {tvLabel(tv)}
                          </option>
                        ))}
                        {/* The owner's Total TV was lowered after this was set. */}
                        {slide.tvNumber > ownerTvs ? (
                          <option value={slide.tvNumber}>TV {slide.tvNumber} (over limit)</option>
                        ) : null}
                      </select>
                    </td>
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
                );
              })
            ) : (
              <tr>
                <td colSpan={COLUMNS} className="px-3 py-8 text-center text-muted">
                  No media yet. Upload images or videos, or add a YouTube link or URL.
                </td>
              </tr>
            )}
            {slides === null ? null : (
              <tr className="border-t border-dashed border-navy/20">
                <td colSpan={COLUMNS} className="p-0">
                  <Link
                    href="/slider/manage/new"
                    className="flex items-center gap-2 px-3 py-3 font-semibold text-teal hover:bg-paper hover:text-navy"
                  >
                    <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-current">
                      +
                    </span>
                    Add new media
                  </Link>
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
            <strong className="text-navy">Have the file?</strong> Choose Add new media → Video upload (MP4) and drop it
            in. MP4 (H.264) or WebM, up to 250 MB.
          </li>
          <li>
            <strong className="text-navy">Already on YouTube?</strong> Choose YouTube video and paste the Share link.
            You&apos;ll see a preview before saving.
          </li>
        </ul>
        <h2 className="font-display mt-6 text-lg font-bold text-navy">Playing on TVs</h2>
        <p className="mt-2">
          Open your player link above on a TV, pick a TV number and enter your password. TV 1 (All) plays every active
          item in order; TV 2 plays items set to TV 2 plus items set to TV 1 (All). TV numbers go up to your Total TV,
          and each plays on one screen at a time. Players check for changes every 5 minutes.
        </p>
      </div>
    </section>
  );
}
