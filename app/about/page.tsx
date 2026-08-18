import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Built for the work that has to land."
        copy="RIO OPTIMA INC. is a business solutions company. We provide technical, project management, and logistics solutions for teams that cannot afford ambiguity — in the design, in the warehouse, or in the schedule."
        image="/images/about-leadership.png"
        imageAlt="Leadership team in a modern office atrium"
      />

      <section className="site-container grid gap-12 py-20 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-navy">
            Who we are
          </h2>
          <hr className="gold-rule mt-4" />
          <p className="mt-5 leading-7 text-muted">
            We were formed to close the gap between technical intent and
            delivered outcome. Too many programs have strong specialists and
            weak coordination — or a project plan that never touches the
            actual system being built. Rio Optima exists so those two
            disciplines sit in one room.
          </p>
          <p className="mt-4 leading-7 text-muted">
            Our people come from engineering, architecture, operations,
            logistics, and PMO backgrounds. We work with private enterprises,
            public programs, and growing firms that need an external backbone
            without losing ownership of the result.
          </p>
        </div>
        <div className="relative min-h-[320px] overflow-hidden">
          <Image
            src="/images/technical-architecture.png"
            alt="Technical drawings and models under review"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="site-container grid gap-6 md:grid-cols-3">
          {[
            ["Technical depth", "We can sit with architects, developers, and operators and talk about the system, not just the status report."],
            ["Delivery discipline", "Scope, schedule, risk, and decision logs are treated as operating tools — not paperwork after the meeting."],
            ["Logistics fluency", "Freight, warehousing, inventory, and last-mile are planned as one network, not three afterthoughts."],
          ].map(([title, copy]) => (
            <article key={title} className="border-t-4 border-teal bg-paper p-6">
              <h3 className="font-display text-xl font-bold text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-container py-16">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/vision-mission"
            className="rounded-[5px] bg-navy px-5 py-2.5 text-sm font-bold text-white uppercase"
          >
            Vision & Mission
          </Link>
          <Link
            href="/contact"
            className="rounded-[5px] bg-gold px-5 py-2.5 text-sm font-bold text-navy uppercase"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
