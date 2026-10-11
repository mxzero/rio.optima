import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Services",
};

type Service = {
  title: string;
  image: string;
  alt: string;
  items: string[];
  purpose?: string;
  href?: string;
  cta?: string;
  featured?: boolean;
};

const services: Service[] = [
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
  {
    title: "Freight and distribution",
    image: "/images/logistics-freight.png",
    alt: "Freight trucks at a distribution center",
    items: [
      "Inbound and outbound freight planning",
      "Carrier coordination and lane performance",
      "Distribution network design",
      "Exception handling across the move",
    ],
  },
  {
    title: "Warehouse operations",
    image: "/images/logistics-warehouse.png",
    alt: "Warehouse racking and pallet movement",
    items: [
      "Receiving, put-away, and inventory control",
      "Slotting, pick-pack, and dispatch cadence",
      "Yard and dock management",
      "Safety, layout, and throughput improvement",
    ],
  },
  {
    title: "Supply chain and last-mile",
    image: "/images/logistics-supply-chain.png",
    alt: "Supply chain control room with shipment maps",
    purpose:
      "Keep freight, inventory, and last-mile routing visible as one operating picture.",
    items: [
      "End-to-end supply chain visibility",
      "Last-mile routing and fleet coordination",
      "Inventory positioning and replenishment",
      "Control-tower reporting for logistics operations",
    ],
  },
  {
    title: "SLIDER",
    image: "/images/slidify-signage.png",
    alt: "SLIDER digital signage on a lobby display",
    purpose:
      "SLIDER is Rio Optima’s screen application. It loops a playlist of images, videos, YouTube links, and web pages on lobby, warehouse, and operations displays so status and messaging stay visible without a dedicated operator.",
    items: [
      "Playlist of images, uploaded videos, YouTube links, and live pages",
      "Fullscreen player for TVs and public screens",
      "Simple manage view after you log in",
    ],
    href: "/slider",
    cta: "Open SLIDER",
    featured: true,
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Services that move work from intent to operation."
        copy="Technical solutions and project management sit beside logistics: freight, warehousing, and supply chain. SLIDER is our in-house application for screens, playlists, and public displays."
        image="/images/logistics-freight.png"
        imageAlt="Distribution center and freight operations"
      />

      <section className="site-container grid gap-10 py-20">
        {services.map((service) => (
          <article
            key={service.title}
            className={`grid overflow-hidden md:grid-cols-2 ${
              service.featured
                ? "border-2 border-gold bg-white"
                : "border border-navy/10 bg-white"
            }`}
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
              {service.purpose ? (
                <p className="mt-4 leading-7 text-muted">{service.purpose}</p>
              ) : null}
              <ul className="mt-5 space-y-2 text-muted">
                {service.items.map((item) => (
                  <li key={item}>— {item}</li>
                ))}
              </ul>
              {service.href ? (
                <Link
                  href={service.href}
                  className="mt-6 inline-flex rounded-[5px] bg-gold px-5 py-2.5 text-sm font-bold text-navy uppercase"
                >
                  {service.cta}
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
