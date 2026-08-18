"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SliderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: { name: string } | null }) => setLoggedIn(Boolean(data.user)))
      .catch(() => setLoggedIn(false));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/slider");
    router.refresh();
  }

  const links = loggedIn
    ? [
        { href: "/slider", label: "Manage" },
        { href: "/slider/how-to", label: "How to" },
        { href: "/slider/fullscreen", label: "Fullscreen" },
      ]
    : [
        { href: "/slider", label: "Overview" },
        { href: "/slider/how-to", label: "How to" },
      ];

  return (
    <header className="border-b border-navy/10 bg-navy text-white">
      <div className="site-container flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/slider" className="font-display text-lg font-extrabold tracking-wide">
          SLIDER
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={pathname === link.href ? "text-gold" : "text-white/80 hover:text-gold"}
            >
              {link.label}
            </Link>
          ))}
          {loggedIn ? (
            <button type="button" onClick={logout} className="rounded-[5px] bg-gold px-3 py-1.5 text-navy">
              Log out
            </button>
          ) : (
            <Link href="/login?next=/slider" className="rounded-[5px] bg-gold px-3 py-1.5 text-navy">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
