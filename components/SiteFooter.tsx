import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="site-container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Image
            src="/logo.png"
            alt="RIO OPTIMA INC."
            width={240}
            height={62}
            className="mb-5 h-12 w-auto rounded-sm bg-white p-1.5"
          />
          <p className="max-w-md text-sm leading-6 text-white/75">
            {brand.legalName} provides technical and project management
            solutions for organizations that need clear delivery, reliable
            systems, and accountable partners.
          </p>
        </div>
        <div>
          <h2 className="font-display mb-3 text-sm font-bold tracking-[0.18em] uppercase text-gold">
            Navigate
          </h2>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link href="/about" className="hover:text-gold">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/vision-mission" className="hover:text-gold">
                Vision & Mission
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-gold">
                Services
              </Link>
            </li>
            <li>
              <Link href="/slidify" className="hover:text-gold">
                Slidify
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-gold">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-display mb-3 text-sm font-bold tracking-[0.18em] uppercase text-gold">
            Contact
          </h2>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              Domain:{" "}
              <span className="text-white">{brand.domain}</span>
            </li>
            <li>
              Email:{" "}
              <a className="text-white hover:text-gold" href={`mailto:${brand.emails.info}`}>
                {brand.emails.info}
              </a>
            </li>
            <li>Office: {brand.phones.office}</li>
            <li>Mobile: {brand.phones.mobile}</li>
            <li>{brand.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/55">
        © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
