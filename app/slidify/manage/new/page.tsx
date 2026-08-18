"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MediaForm from "@/components/slidify/MediaForm";
import SlidifyNav from "@/components/slidify/SlidifyNav";
import { Slide, loadSlides, saveSlides } from "@/lib/slidify";

export default function NewMediaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSlides();
    setReady(true);
  }, []);

  function onSave(slide: Slide) {
    const slides = loadSlides();
    saveSlides([slide, ...slides]);
    router.push("/slidify/manage");
  }

  return (
    <div>
      <SlidifyNav />
      <section className="site-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-navy">New media</h1>
        <p className="mt-2 text-muted">Add an image upload, a YouTube video URL, or a website URL.</p>
        <div className="mt-6">{ready ? <MediaForm onSave={onSave} cancelHref="/slidify/manage" /> : null}</div>
      </section>
    </div>
  );
}
