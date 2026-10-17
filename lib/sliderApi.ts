// Browser-side calls to the SLIDER API.

import { upload } from "@vercel/blob/client";
import type { Slide, SlideFields } from "@/lib/slider";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function fetchSlides() {
  return (await call<{ slides: Slide[] }>("/api/slider/slides")).slides;
}

export async function fetchSlide(id: string) {
  return (await call<{ slide: Slide }>(`/api/slider/slides/${id}`)).slide;
}

export async function saveLinkSlide(fields: SlideFields, id?: string) {
  const url = id ? `/api/slider/slides/${id}` : "/api/slider/slides";
  return (await call<{ slide: Slide }>(url, json(id ? "PATCH" : "POST", fields))).slide;
}

export async function removeSlide(id: string) {
  await call(`/api/slider/slides/${id}`, { method: "DELETE" });
}

export async function placeSlide(id: string, placement: { order?: number; tvNumber?: number | null }) {
  return (await call<{ slide: Slide }>(`/api/slider/slides/${id}/placement`, json("PATCH", placement))).slide;
}

type UploadTarget = { mode: "blob" | "direct"; folder: string };
let target: Promise<UploadTarget> | null = null;

function uploadTarget() {
  target ??= call<UploadTarget>("/api/slider/upload");
  target.catch(() => {
    target = null;
  });
  return target;
}

// Uploads one file and saves its slide, reporting progress from 0 to 1. On
// Vercel the file goes straight to Blob storage; locally it streams through
// the API.
export async function uploadSlide(
  file: File,
  fields: SlideFields,
  onProgress: (fraction: number) => void,
  id?: string,
): Promise<Slide> {
  const { mode, folder } = await uploadTarget();
  if (mode === "direct") return uploadDirect(file, fields, onProgress, id);
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80) || "upload";
  let blob;
  try {
    blob = await upload(folder + safeName, file, {
      access: "private",
      handleUploadUrl: "/api/slider/upload",
      clientPayload: JSON.stringify({ mediaType: fields.mediaType }),
      contentType: file.type,
      multipart: file.size > 50 * 1024 * 1024,
      onUploadProgress: (event) => onProgress(event.percentage / 100),
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message.replace(/^Vercel Blob: /, "") : "Upload failed.");
  }
  return saveLinkSlide({ ...fields, blobPathname: blob.pathname }, id);
}

function uploadDirect(
  file: File,
  fields: SlideFields,
  onProgress: (fraction: number) => void,
  id?: string,
): Promise<Slide> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(id ? "PATCH" : "POST", id ? `/api/slider/slides/${id}` : "/api/slider/slides");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("X-Slide", encodeURIComponent(JSON.stringify(fields)));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let data: { slide?: Slide; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.slide) resolve(data.slide);
      else reject(new Error(data.error || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network error. Check the connection and try again."));
    xhr.send(file);
  });
}
