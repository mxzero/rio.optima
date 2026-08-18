"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MediaForm from "@/components/slider/MediaForm";
import SliderNav from "@/components/slider/SliderNav";
import { Slide, loadSlides, saveSlides } from "@/lib/slider";

export default function EditMediaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [slide, setSlide] = useState<Slide | null>(null);

  useEffect(() => {
    const found = loadSlides().find((item) => item.id === params.id) || null;
    setSlide(found);
  }, [params.id]);

  function onSave(next: Slide) {
    saveSlides(loadSlides().map((item) => (item.id === next.id ? next : item)));
    router.push("/slider/manage");
  }

  return (
    <div>
      <SliderNav />
      <section className="site-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-navy">Edit media</h1>
        <div className="mt-6">
          {slide ? (
            <MediaForm slide={slide} onSave={onSave} cancelHref="/slider/manage" />
          ) : (
            <p className="text-muted">Media not found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
