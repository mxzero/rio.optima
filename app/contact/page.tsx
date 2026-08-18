import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="Tell us about the work."
        copy="Use the form for a first brief. Domain, email, and numbers below are placeholders until the live channels are confirmed."
        image="/images/about-leadership.png"
        imageAlt="Consultants in conversation in a modern atrium"
      />

      <section className="site-container grid gap-10 py-20 lg:grid-cols-[1fr_1.15fr]">
        <aside className="bg-navy p-8 text-white">
          <h2 className="font-display text-2xl font-bold">Reach us</h2>
          <hr className="gold-rule mt-4" />
          <dl className="mt-6 space-y-5 text-sm leading-6">
            <div>
              <dt className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase">
                Domain
              </dt>
              <dd className="mt-1 text-lg">{brand.domain}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase">
                Email
              </dt>
              <dd className="mt-1">
                <a className="hover:text-gold" href={`mailto:${brand.emails.info}`}>
                  {brand.emails.info}
                </a>
              </dd>
              <dd>
                <a className="hover:text-gold" href={`mailto:${brand.emails.projects}`}>
                  {brand.emails.projects}
                </a>
              </dd>
              <dd>
                <a className="hover:text-gold" href={`mailto:${brand.emails.logistics}`}>
                  {brand.emails.logistics}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase">
                Contact numbers
              </dt>
              <dd className="mt-1">Office {brand.phones.office}</dd>
              <dd>Mobile {brand.phones.mobile}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase">
                Address
              </dt>
              <dd className="mt-1">{brand.address}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase">
                Hours
              </dt>
              <dd className="mt-1">{brand.hours}</dd>
            </div>
          </dl>
        </aside>
          <ContactForm />
      </section>
    </>
  );
}
