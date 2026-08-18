"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MediaForm from "@/components/slidify/MediaForm";
import SlidifyNav from "@/components/slidify/SlidifyNav";
import { Slide, loadSlides, saveSlides } from "@/lib/slidify";

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
    router.push("/slidify/manage");
  }

  return (
    <div>
      <SlidifyNav />
      <section className="site-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-navy">Edit media</h1>
        <div className="mt-6">
          {slide ? (
            <MediaForm slide={slide} onSave={onSave} cancelHref="/slidify/manage" />
          ) : (
            <p className="text-muted">Media not found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
