"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/slider";
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setSending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to sign in.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-8 shadow-sm">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Email
        <input
          required
          type="email"
          name="email"
          autoComplete="username"
          placeholder="admin@rio.optima"
          className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Password
        <input
          required
          type="password"
          name="password"
          autoComplete="current-password"
          className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal"
        />
      </label>
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-[5px] bg-navy px-5 py-3 text-sm font-bold text-white uppercase disabled:opacity-60"
      >
        {sending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="site-container grid max-w-lg gap-6 py-20">
      <div className="bg-white p-4">
        <Image
          src="/logo.png"
          alt="RIO OPTIMA INC."
          width={280}
          height={78}
          className="mx-auto h-16 w-auto bg-white"
          priority
        />
      </div>
      <div>
        <p className="text-xs font-bold tracking-[0.28em] text-teal uppercase">Account</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold text-navy">Log in</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage SLIDER playlists.</p>
      </div>
      <Suspense fallback={<div className="bg-white p-8 text-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
      <Link href="/" className="text-sm font-semibold text-teal hover:text-navy">
        Back to home
      </Link>
    </section>
  );
}
