import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[88vh] overflow-hidden bg-navy text-white">
        <Image
          src="/images/hero-collaboration.png"
          alt="Project leaders collaborating in a modern boardroom"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/88 to-teal/35" />
        <div className="site-container relative flex min-h-[88vh] items-center py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.32em] text-gold uppercase">
              Business solutions
            </p>
            <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Clarity in technology.
              <span className="block text-gold">Control in delivery.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
              {brand.legalName} helps organizations plan, build, and run
              technical programs with the same discipline we bring to project
              management — from architecture to go-live, and from Gantt to
              lobby screens.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-[5px] bg-gold px-6 py-3 text-sm font-bold tracking-wide text-navy uppercase"
              >
                Contact Us
              </Link>
              <Link
                href="/services"
                className="rounded-[5px] border border-white/30 px-6 py-3 text-sm font-bold tracking-wide text-white uppercase hover:border-gold hover:text-gold"
              >
                View services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy">
        <div className="site-container grid gap-8 py-8 text-white md:grid-cols-3">
          {[
            ["Technical solutions", "Architecture, systems, and implementation that hold under pressure."],
            ["Project management", "Governance, schedules, and accountable delivery from kickoff to close."],
            ["Slidify", "Play images, videos, and URLs on any screen — a Rio Optima product."],
          ].map(([title, copy]) => (
            <div key={title} className="border-l-2 border-gold pl-4">
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-white/70">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-container grid items-center gap-12 py-20 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.28em] text-teal uppercase">
            About us
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-navy md:text-4xl">
            A partner for complex work, not a vendor of busywork.
          </h2>
          <hr className="gold-rule mt-5" />
          <p className="mt-5 leading-7 text-muted">
            We sit at the intersection of engineering and execution. Clients
            come to us when a program needs both a technical spine and a
            project operating system — someone who can translate drawings,
            systems, and stakeholder pressure into a plan that actually ships.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex rounded-[5px] bg-navy px-5 py-2.5 text-sm font-bold text-white uppercase"
          >
            Our story
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="/images/about-leadership.png"
            alt="Consultants walking through a modern office atrium"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.28em] text-teal uppercase">
              Services
            </p>
            <h2 className="font-display mt-3 text-3xl font-extrabold text-navy md:text-4xl">
              Solutions built for operators, not slide decks.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <article className="overflow-hidden border border-navy/10 bg-paper">
              <div className="relative h-52">
                <Image
                  src="/images/technical-architecture.png"
                  alt="Engineers reviewing technical drawings"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-navy">
                  Technical solutions
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  System design, integration, and technical program leadership
                  for infrastructure, software, and operations.
                </p>
              </div>
            </article>
            <article className="overflow-hidden border border-navy/10 bg-paper">
              <div className="relative h-52">
                <Image
                  src="/images/project-delivery.png"
                  alt="Project manager presenting a delivery timeline"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-navy">
                  Project management
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  PMO setup, schedule control, risk, and stakeholder
                  reporting that keeps executives and teams aligned.
                </p>
              </div>
            </article>
            <article className="overflow-hidden border-2 border-gold bg-white">
              <div className="relative h-52">
                <Image
                  src="/images/slidify-signage.png"
                  alt="Digital signage display in a corporate lobby"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-[11px] font-bold tracking-[0.22em] text-gold uppercase">
                  Featured product
                </p>
                <h3 className="font-display mt-1 text-xl font-bold text-navy">
                  Slidify
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Image and video display for screens and playlists. Manage
                  media, then open the fullscreen player on any lobby or
                  operations display.
                </p>
                <Link
                  href="/slidify"
                  className="mt-4 inline-flex rounded-[5px] bg-gold px-4 py-2 text-xs font-bold tracking-wide text-navy uppercase"
                >
                  Launch Slidify
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-teal py-16 text-white">
        <div className="site-container relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold">
              Ready to put a program on a firmer footing?
            </h2>
            <p className="mt-2 max-w-xl text-white/85">
              Tell us about the work. Domain, email, and numbers below are
              placeholders until the live channels are confirmed.
            </p>
          </div>
          <Link
            href="/contact"
            className="rounded-[5px] bg-gold px-6 py-3 text-sm font-bold text-navy uppercase"
          >
            Start a conversation
          </Link>
        </div>
      </section>
    </>
  );
}
