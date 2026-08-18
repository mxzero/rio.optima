"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MediaForm from "@/components/slider/MediaForm";
import SliderNav from "@/components/slider/SliderNav";
import { Slide, loadSlides, saveSlides } from "@/lib/slider";

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
    router.push("/slider/manage");
  }

  return (
    <div>
      <SliderNav />
      <section className="site-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-navy">New media</h1>
        <p className="mt-2 text-muted">Add an image upload, a YouTube video URL, or a website URL.</p>
        <div className="mt-6">{ready ? <MediaForm onSave={onSave} cancelHref="/slider/manage" /> : null}</div>
      </section>
    </div>
  );
}
