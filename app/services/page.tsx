import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Services",
};

const services = [
  {
    title: "Technical solutions",
    image: "/images/technical-architecture.png",
    alt: "Technical architecture review",
    items: [
      "Solution architecture and systems integration",
      "Technical program leadership and design review",
      "Implementation support from prototype to production",
      "Operational readiness and handover",
    ],
  },
  {
    title: "Project management",
    image: "/images/project-delivery.png",
    alt: "Project delivery briefing",
    items: [
      "PMO setup and delivery operating model",
      "Schedule, cost, and risk control",
      "Stakeholder governance and reporting",
      "Recovery of programs that have drifted",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Services that move work from intent to operation."
        copy="Technical solutions and project management are the core of the practice. Slidify is our in-house application for screens, playlists, and public displays."
        image="/images/project-delivery.png"
        imageAlt="Project delivery session in a boardroom"
      />

      <section className="site-container grid gap-10 py-20">
        {services.map((service) => (
          <article
            key={service.title}
            className="grid overflow-hidden border border-navy/10 bg-white md:grid-cols-2"
          >
            <div className="relative min-h-[260px]">
              <Image
                src={service.image}
                alt={service.alt}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-8">
              <h2 className="font-display text-2xl font-extrabold text-navy">
                {service.title}
              </h2>
              <hr className="gold-rule mt-4" />
              <ul className="mt-5 space-y-2 text-muted">
                {service.items.map((item) => (
                  <li key={item}>— {item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-navy py-16 text-white">
        <div className="site-container grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">
              Featured application
            </p>
            <h2 className="font-display mt-3 text-4xl font-extrabold">
              Slidify
            </h2>
            <p className="mt-4 leading-7 text-white/80">
              Play images, YouTube videos, and web pages on any screen.
              Subscribe, manage a playlist, and open the fullscreen player on
              a lobby, command center, or shop-floor display. Slidify hosts
              the slider — video files stay on YouTube.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/slidify"
                className="rounded-[5px] bg-gold px-5 py-2.5 text-sm font-bold text-navy uppercase"
              >
                Open Slidify
              </Link>
              <Link
                href="/contact?product=slidify"
                className="rounded-[5px] border border-white/30 px-5 py-2.5 text-sm font-bold uppercase hover:border-gold hover:text-gold"
              >
                Request access
              </Link>
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden">
            <Image
              src="/images/slidify-signage.png"
              alt="Slidify running on a lobby display"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
