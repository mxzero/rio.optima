// Browser-side calls to the SLIDER API.

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

// Streams one file to the server, reporting progress from 0 to 1.
export function uploadSlide(
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
