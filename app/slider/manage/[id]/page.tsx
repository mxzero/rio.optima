"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MediaForm from "@/components/slider/MediaForm";
import SliderNav from "@/components/slider/SliderNav";
import { Slide } from "@/lib/slider";
import { fetchSlide } from "@/lib/sliderApi";

export default function EditMediaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [slide, setSlide] = useState<Slide | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSlide(params.id)
      .then(setSlide)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  return (
    <div>
      <SliderNav />
      <section className="site-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-navy">Edit media</h1>
        {slide?.ownerName ? <p className="mt-2 text-muted">Uploaded by {slide.ownerName}</p> : null}
        <div className="mt-6">
          {slide ? (
            <MediaForm slide={slide} onDone={() => router.push("/slider/manage")} cancelHref="/slider/manage" />
          ) : (
            <p className="text-muted">{error || "Loading…"}</p>
          )}
        </div>
      </section>
    </div>
  );
}
