"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/slidify", label: "Slidify" },
  { href: "/slidify/how-to", label: "How to" },
  { href: "/slidify/manage", label: "Manage" },
  { href: "/slidify/fullscreen", label: "Fullscreen" },
];

export default function SlidifyNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-navy/10 bg-navy text-white">
      <div className="site-container flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/slidify" className="font-display text-lg font-extrabold tracking-wide">
          Slidify
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href ? "text-gold" : "text-white/80 hover:text-gold"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact?product=slidify" className="rounded-[5px] bg-gold px-3 py-1.5 text-navy">
            Subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
}
