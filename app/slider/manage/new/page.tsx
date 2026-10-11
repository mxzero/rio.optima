"use client";

import { useRouter } from "next/navigation";
import MediaForm from "@/components/slider/MediaForm";
import SliderNav from "@/components/slider/SliderNav";

export default function NewMediaPage() {
  const router = useRouter();

  return (
    <div>
      <SliderNav />
      <section className="site-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-navy">New media</h1>
        <p className="mt-2 text-muted">Upload images or MP4 videos (several at once), or add a YouTube link or web page.</p>
        <div className="mt-6">
          <MediaForm onDone={() => router.push("/slider/manage")} cancelHref="/slider/manage" />
        </div>
      </section>
    </div>
  );
}
