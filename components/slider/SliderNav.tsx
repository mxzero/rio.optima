"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionUser, isAdmin } from "@/lib/auth";

export default function SliderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const loggedIn = Boolean(user);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: SessionUser | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
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
        ...(isAdmin(user) ? [{ href: "/admin", label: "Admin" }] : []),
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
