import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Vision & Mission",
};

export default function VisionMissionPage() {
  return (
    <>
      <PageHero
        eyebrow="Direction"
        title="Vision and mission"
        copy="We exist so technical ambition and project reality stay in the same conversation — until the work is in production."
        image="/images/vision-mission.png"
        imageAlt="Strategy session with maps, models, and light"
      />

      <section className="site-container grid gap-8 py-20 md:grid-cols-2">
        <article className="bg-navy p-8 text-white md:p-10">
          <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">
            Vision
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold">
            To be the partner organizations trust when the work is both
            technical and consequential.
          </h2>
          <p className="mt-5 leading-7 text-white/80">
            We see a future where programs do not choose between elegant
            systems and on-time delivery. Rio Optima will be known for
            bringing both — quietly, rigorously, and without theatre.
          </p>
        </article>
        <article className="border border-navy/10 bg-white p-8 md:p-10">
          <p className="text-xs font-bold tracking-[0.28em] text-teal uppercase">
            Mission
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-navy">
            Turn complex technical and project challenges into executable
            programs.
          </h2>
          <p className="mt-5 leading-7 text-muted">
            We design the technical path, install the delivery cadence, and
            stay until the outcome is operational. Where a product can remove
            friction — as Slidify does for screens and playlists — we build
            it, put it in our clients’ hands, and support it.
          </p>
        </article>
      </section>

      <section className="bg-white py-16">
        <div className="site-container grid items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/project-delivery.png"
              alt="Stakeholders reviewing a program timeline"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold text-navy">
              How we hold the line
            </h2>
            <hr className="gold-rule mt-4" />
            <ul className="mt-6 space-y-4 text-muted">
              <li>
                <strong className="text-navy">Precision over volume.</strong>{" "}
                Fewer workstreams. Clearer owners. Decisions that stick.
              </li>
              <li>
                <strong className="text-navy">Evidence over opinion.</strong>{" "}
                Plans, drawings, and status that can be inspected.
              </li>
              <li>
                <strong className="text-navy">Partnership over handoff.</strong>{" "}
                We do not disappear once the slide is approved.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
