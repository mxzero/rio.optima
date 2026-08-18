"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MediaType, Orientation, Slide, youtubeIdFromUrl } from "@/lib/slider";

type Props = {
  slide?: Slide | null;
  onSave: (slide: Slide) => void;
  cancelHref: string;
};

export default function MediaForm({ slide, onSave, cancelHref }: Props) {
  const [mediaType, setMediaType] = useState<MediaType>(slide?.mediaType || "image");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const durationRaw = String(form.get("duration") || "");
    const durationSeconds = Number(durationRaw);
    const type = String(form.get("media_type") || "image") as MediaType;
    const orientation = String(form.get("orientation") || "landscape") as Orientation;
    const startDate = String(form.get("start_date") || new Date().toISOString().slice(0, 10));
    const endDate = String(form.get("end_date") || "");
    const shortDescription = String(form.get("short_description") || "").trim();
    const isActive = slide ? form.get("is_active") === "on" : true;

    if (!name) return setError("Slide name is required.");
    if (!durationSeconds || durationSeconds < 1) return setError("Duration must be at least 1 second.");

    let src = slide?.src || "";
    if (type === "image") {
      const file = form.get("media_file");
      if (file instanceof File && file.size > 0) {
        src = await fileToDataUrl(file);
      }
      if (!src) return setError("Upload an image file.");
    } else {
      src = String(form.get("media_url") || "").trim();
      if (!src) return setError(type === "video" ? "Paste a YouTube video URL." : "A website URL is required.");
      if (type === "video" && !youtubeIdFromUrl(src)) {
        return setError("That does not look like a YouTube video URL.");
      }
    }

    onSave({
      id: slide?.id || crypto.randomUUID(),
      name,
      durationSeconds,
      shortDescription,
      startDate,
      endDate,
      orientation,
      mediaType: type,
      src,
      isActive,
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 border border-navy/10 bg-white p-6">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Slide name *
        <input
          name="name"
          required
          defaultValue={slide?.name || ""}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Duration (seconds) *
        <input
          name="duration"
          type="number"
          min={1}
          required
          defaultValue={slide?.durationSeconds ?? 8}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Short description
        <input
          name="short_description"
          maxLength={255}
          defaultValue={slide?.shortDescription || ""}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Start date
          <input
            name="start_date"
            type="date"
            defaultValue={slide?.startDate || new Date().toISOString().slice(0, 10)}
            className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          End date
          <input
            name="end_date"
            type="date"
            defaultValue={slide?.endDate || ""}
            className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Orientation
        <select
          name="orientation"
          defaultValue={slide?.orientation || "landscape"}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        >
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Type *
        <select
          name="media_type"
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as MediaType)}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="url">URL</option>
        </select>
      </label>
      {mediaType === "image" ? (
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Upload image *
          <input name="media_file" type="file" accept="image/*" className="font-normal" />
          <span className="text-xs font-normal text-muted">
            JPG, PNG, GIF, or WebP. {slide?.src ? "Leave empty to keep the current image." : ""}
          </span>
        </label>
      ) : null}
      {mediaType === "video" ? (
        <div className="space-y-3">
          <p className="border border-gold/40 bg-gold/10 p-3 text-sm text-navy">
            <strong>Upload the video to YouTube first.</strong> Paste a watch or share URL. SLIDER hosts the player, not the video.
          </p>
          <label className="grid gap-1.5 text-sm font-semibold text-navy">
            YouTube video URL *
            <input
              name="media_url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              defaultValue={slide?.mediaType === "video" ? slide.src : ""}
              className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
            />
          </label>
        </div>
      ) : null}
      {mediaType === "url" ? (
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          URL *
          <input
            name="media_url"
            type="url"
            placeholder="https://"
            defaultValue={slide?.mediaType === "url" ? slide.src : ""}
            className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
          />
        </label>
      ) : null}
      {slide ? (
        <label className="flex items-center gap-2 text-sm font-semibold text-navy">
          <input type="checkbox" name="is_active" defaultChecked={slide.isActive} />
          Active
        </label>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="rounded-[5px] bg-navy px-5 py-2.5 text-sm font-bold text-white uppercase">
          {slide ? "Save media" : "Add media"}
        </button>
        <Link href={cancelHref} className="rounded-[5px] bg-teal px-5 py-2.5 text-sm font-bold text-white uppercase">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}
