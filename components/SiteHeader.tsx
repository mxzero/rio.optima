"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionUser, isAdmin } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/vision-mission", label: "Vision & Mission" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact Us" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: SessionUser | null }) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white">
      <div className="site-container flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex min-w-0 items-center bg-white" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="RIO OPTIMA INC."
            width={280}
            height={72}
            className="h-11 w-auto bg-white sm:h-14"
            priority
          />
        </Link>
        <button
          type="button"
          className="rounded-[5px] border border-navy/20 px-3 py-2 text-sm font-semibold text-navy md:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav
          className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-1 border-b border-navy/10 bg-white px-5 py-3 md:static md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:bg-transparent md:p-0`}
        >
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-[13px] font-semibold tracking-wide uppercase ${
                  active ? "text-teal" : "text-navy hover:text-teal"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              {isAdmin(user) ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={`text-[13px] font-semibold tracking-wide uppercase ${
                    pathname.startsWith("/admin") ? "text-teal" : "text-navy hover:text-teal"
                  }`}
                >
                  Admin
                </Link>
              ) : null}
              <span className="text-[13px] font-semibold text-navy">{user.name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-[5px] border border-navy/20 px-3 py-2 text-[13px] font-bold uppercase tracking-wide text-navy"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-[5px] bg-navy px-3.5 py-2 text-center text-[13px] font-bold uppercase tracking-wide text-white"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
