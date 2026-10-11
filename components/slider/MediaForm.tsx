"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import MediaDropzone from "@/components/slider/MediaDropzone";
import {
  IMAGE_MAX_MB,
  IMAGE_TYPES,
  Orientation,
  Slide,
  SlideFields,
  VIDEO_MAX_MB,
  VIDEO_TYPES,
  checkMediaFile,
  formatBytes,
  isYoutubeSlide,
  youtubeIdFromUrl,
} from "@/lib/slider";
import { saveLinkSlide, uploadSlide } from "@/lib/sliderApi";

type Kind = "image" | "video-file" | "youtube" | "url";

type Entry = {
  key: string;
  file: File;
  status: "checking" | "ready" | "invalid" | "saving" | "added" | "failed";
  title?: string;
  reason?: string;
  durationSeconds?: number;
  progress?: number;
};

type Props = {
  slide?: Slide | null;
  onDone: () => void;
  cancelHref: string;
};

function kindOf(slide?: Slide | null): Kind {
  if (!slide) return "image";
  if (slide.mediaType === "video") return isYoutubeSlide(slide) ? "youtube" : "video-file";
  return slide.mediaType;
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function baseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "") || file.name;
}

export default function MediaForm({ slide, onDone, cancelHref }: Props) {
  const [kind, setKind] = useState<Kind>(kindOf(slide));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState(slide && isYoutubeSlide(slide) ? slide.src : "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const isUpload = kind === "image" || kind === "video-file";
  const keepsCurrentFile = Boolean(slide && kindOf(slide) === kind && slide.src);
  const youtubeId = youtubeIdFromUrl(youtubeUrl);

  function update(key: string, patch: Partial<Entry>) {
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }

  function changeKind(next: Kind) {
    setKind(next);
    setEntries([]);
    setError("");
    setNotice("");
  }

  function addFiles(files: File[]) {
    setError("");
    setNotice("");
    const expect = kind === "image" ? "image" : "video";
    const known = new Set(entries.map((entry) => entry.key));
    const fresh = files
      .filter((file) => !known.has(fileKey(file)))
      .map((file): Entry => ({ key: fileKey(file), file, status: "checking" }));
    if (!fresh.length) return;
    // Editing replaces a single file; new media can take many.
    setEntries((current) => (slide ? fresh.slice(0, 1) : [...current, ...fresh]));
    for (const entry of slide ? fresh.slice(0, 1) : fresh) {
      checkMediaFile(entry.file, expect).then((result) =>
        update(
          entry.key,
          result.ok
            ? { status: "ready", durationSeconds: result.durationSeconds }
            : { status: "invalid", title: result.title, reason: result.reason },
        ),
      );
    }
  }

  function removeEntry(key: string) {
    setEntries((current) => current.filter((entry) => entry.key !== key));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const durationRaw = String(form.get("duration") || "").trim();
    const fields = {
      shortDescription: String(form.get("short_description") || "").trim(),
      startDate: String(form.get("start_date") || new Date().toISOString().slice(0, 10)),
      endDate: String(form.get("end_date") || ""),
      orientation: String(form.get("orientation") || "landscape") as Orientation,
      isActive: slide ? form.get("is_active") === "on" : true,
    };
    const mediaType = kind === "image" ? "image" : kind === "url" ? "url" : "video";

    // Video files may leave duration blank to play for the video's length.
    let duration: number | null = null;
    if (durationRaw) {
      duration = Number(durationRaw);
      if (!Number.isFinite(duration) || duration < 1) return setError("Duration must be at least 1 second.");
    } else if (kind !== "video-file") {
      return setError("Duration must be at least 1 second.");
    }

    const fieldsFor = (slideName: string, fallbackDuration?: number): SlideFields => ({
      ...fields,
      name: slideName,
      durationSeconds: duration ?? Math.max(1, Math.ceil(fallbackDuration ?? slide?.durationSeconds ?? 8)),
      mediaType,
    });

    if (!isUpload) {
      if (!name) return setError("Slide name is required.");
      const src = kind === "youtube" ? youtubeUrl.trim() : String(form.get("media_url") || "").trim();
      if (!src) return setError(kind === "youtube" ? "Paste a YouTube video link." : "A website URL is required.");
      if (kind === "youtube" && !youtubeId) return setError("That does not look like a YouTube video link.");
      return saveSingle(() => saveLinkSlide({ ...fieldsFor(name), src }, slide?.id));
    }

    if (entries.some((entry) => entry.status === "checking")) {
      return setError("Still checking your files. Try again in a moment.");
    }
    const ready = entries.filter((entry) => entry.status === "ready" || entry.status === "failed");
    if (!ready.length) {
      if (slide && keepsCurrentFile && !entries.length) {
        if (!name) return setError("Slide name is required.");
        return saveSingle(() => saveLinkSlide(fieldsFor(name), slide.id));
      }
      return setError(
        entries.length
          ? "None of the selected files can be uploaded. Remove them or choose different files."
          : `Add ${kind === "image" ? "an image" : "a video"} to upload.`,
      );
    }
    if (slide && !name) return setError("Slide name is required.");

    // Each file uploads on its own so one failure doesn't stop the rest.
    setBusy(true);
    let added = 0;
    for (const [index, entry] of ready.entries()) {
      update(entry.key, { status: "saving", progress: 0, title: undefined, reason: undefined });
      const slideName = !name ? baseName(entry.file) : ready.length > 1 ? `${name} ${index + 1}` : name;
      try {
        await uploadSlide(
          entry.file,
          fieldsFor(slideName, entry.durationSeconds),
          (progress) => update(entry.key, { progress }),
          slide?.id,
        );
        added++;
        update(entry.key, { status: "added" });
      } catch (err) {
        update(entry.key, {
          status: "failed",
          title: "Upload failed",
          reason: err instanceof Error ? err.message : "Could not upload this file.",
        });
      }
    }
    setBusy(false);

    const leftover = entries.length - added;
    if (!added) return setError("No files were added. See the reason next to each file.");
    if (!leftover) return onDone();
    setEntries((current) => current.filter((entry) => entry.status !== "added"));
    setNotice(`${added} of ${entries.length} files added to the playlist. The files still listed below were not added.`);
  }

  async function saveSingle(save: () => Promise<Slide>) {
    setBusy(true);
    try {
      await save();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this media.");
    } finally {
      setBusy(false);
    }
  }

  const accept = kind === "image" ? IMAGE_TYPES.join(",") : VIDEO_TYPES.join(",");
  const hint =
    kind === "image"
      ? `JPG, PNG, GIF, or WebP · up to ${IMAGE_MAX_MB} MB each`
      : `MP4 or WebM · up to ${VIDEO_MAX_MB} MB each`;

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 border border-navy/10 bg-white p-6">
      {error ? (
        <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="border border-gold/40 bg-gold/10 p-3 text-sm text-navy">
          {notice}{" "}
          <Link href={cancelHref} className="font-bold underline">
            Back to playlist
          </Link>
        </p>
      ) : null}
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Type *
        <select
          value={kind}
          onChange={(event) => changeKind(event.target.value as Kind)}
          disabled={busy}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        >
          <option value="image">Image upload</option>
          <option value="video-file">Video upload (MP4)</option>
          <option value="youtube">YouTube video</option>
          <option value="url">Web page URL</option>
        </select>
      </label>

      {isUpload ? (
        <div className="space-y-3">
          <MediaDropzone
            key={kind}
            accept={accept}
            multiple={!slide}
            hint={hint}
            disabled={busy}
            onFiles={addFiles}
          />
          {keepsCurrentFile && !entries.length ? (
            <p className="text-xs text-muted">Keeping the current file. Add a new one to replace it.</p>
          ) : null}
          {entries.length ? (
            <ul className="divide-y divide-navy/10 border border-navy/10">
              {entries.map((entry) => (
                <FileRow key={entry.key} entry={entry} disabled={busy} onRemove={() => removeEntry(entry.key)} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {kind === "youtube" ? (
        <div className="space-y-3">
          <label className="grid gap-1.5 text-sm font-semibold text-navy">
            YouTube video link *
            <input
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
              className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
            />
            <span className="text-xs font-normal text-muted">
              Paste the link from YouTube&apos;s Share button. Watch, share, Shorts, and embed links all work.
            </span>
          </label>
          {youtubeUrl.trim() && !youtubeId ? (
            <p className="text-sm text-red-700">That doesn&apos;t look like a YouTube video link.</p>
          ) : null}
          {youtubeId ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                className="absolute inset-0 h-full w-full border-0"
                allow="encrypted-media; picture-in-picture"
                title="YouTube preview"
              />
            </div>
          ) : null}
          <p className="text-xs text-muted">
            Have the video file? Choose <strong>Video upload (MP4)</strong> instead. No YouTube needed.
          </p>
        </div>
      ) : null}

      {kind === "url" ? (
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

      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Slide name {isUpload && !slide ? "" : "*"}
        <input
          name="name"
          defaultValue={slide?.name || ""}
          placeholder={isUpload && !slide ? "Defaults to the file name" : ""}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        />
        {isUpload && !slide ? (
          <span className="text-xs font-normal text-muted">
            With several files, each slide gets this name plus a number.
          </span>
        ) : null}
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Duration (seconds) {kind === "video-file" ? "" : "*"}
        <input
          key={kind}
          name="duration"
          type="number"
          min={1}
          defaultValue={slide && kindOf(slide) === kind ? slide.durationSeconds : kind === "video-file" ? "" : 8}
          placeholder={kind === "video-file" ? "Video length" : ""}
          className="rounded-[5px] border border-navy/20 px-3 py-2 font-normal"
        />
        {kind === "video-file" ? (
          <span className="text-xs font-normal text-muted">Leave blank to play the whole video.</span>
        ) : null}
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
      {slide ? (
        <label className="flex items-center gap-2 text-sm font-semibold text-navy">
          <input type="checkbox" name="is_active" defaultChecked={slide.isActive} />
          Active
        </label>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[5px] bg-navy px-5 py-2.5 text-sm font-bold text-white uppercase disabled:opacity-60"
        >
          {busy ? "Uploading…" : slide ? "Save media" : "Add media"}
        </button>
        <Link href={cancelHref} className="rounded-[5px] bg-teal px-5 py-2.5 text-sm font-bold text-white uppercase">
          Cancel
        </Link>
      </div>
    </form>
  );
}

const STATUS_TEXT: Record<Entry["status"], [string, string]> = {
  checking: ["Checking…", "bg-navy/10 text-navy"],
  ready: ["Ready", "bg-teal/15 text-teal"],
  invalid: ["Can't upload", "bg-red-100 text-red-800"],
  saving: ["Uploading…", "bg-gold/20 text-navy"],
  added: ["Added", "bg-teal text-white"],
  failed: ["Failed", "bg-red-100 text-red-800"],
};

function FileRow({ entry, disabled, onRemove }: { entry: Entry; disabled: boolean; onRemove: () => void }) {
  const [text, tone] = STATUS_TEXT[entry.status];
  const label =
    entry.status === "saving" && entry.progress !== undefined ? `Uploading ${Math.round(entry.progress * 100)}%` : text;
  return (
    <li className="flex items-start gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy" title={entry.file.name}>
          {entry.file.name}
        </p>
        <p className="text-xs text-muted">{formatBytes(entry.file.size)}</p>
        {entry.reason ? (
          <p className="mt-1 text-xs text-red-800">
            <strong>{entry.title}.</strong> {entry.reason}
          </p>
        ) : null}
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
      {entry.status !== "saving" && entry.status !== "added" ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${entry.file.name}`}
          className="shrink-0 px-1 text-muted hover:text-navy"
        >
          ✕
        </button>
      ) : null}
    </li>
  );
}
