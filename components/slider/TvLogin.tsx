"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TvChoice } from "@/lib/auth";

type Notice = { message: string; reason: "limit" | "taken" };

const fieldClass = "rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal";

// Sign-in shown at /sfs/<code> before a TV plays. The code already names the
// account, so only the TV number and password are entered.
export default function TvLogin({
  code,
  username,
  totalTvs,
  lastTv,
  notice: initialNotice,
}: {
  code: string;
  username: string;
  totalTvs: number;
  lastTv?: TvChoice;
  notice?: Notice;
}) {
  const router = useRouter();
  const [tv, setTv] = useState<string>(String(lastTv && (lastTv === "all" || lastTv <= totalTvs) ? lastTv : "all"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(initialNotice ?? null);
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/sfs/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, tv, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; reason?: Notice["reason"] };
      if (response.ok && data.ok) {
        router.refresh();
        return;
      }
      if (response.status === 409 && data.reason) setNotice({ message: data.error || "", reason: data.reason });
      else setError(data.error || "Unable to sign in.");
      setSending(false);
    } catch {
      setError("Network error. Check the connection and try again.");
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-navy">
      <div className="mx-auto grid min-h-full max-w-md content-center gap-6 px-4 py-10">
        <div className="bg-white p-4">
          <Image src="/logo.png" alt="RIO OPTIMA INC." width={280} height={78} className="mx-auto h-14 w-auto" priority />
        </div>
        <div className="text-white">
          <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">SLIDER · TV code {code}</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold">Start this TV</h1>
          <p className="mt-2 text-sm text-white/75">Pick which TV this is and enter the account password.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 shadow-sm sm:p-8">
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <label className="grid gap-1.5 text-sm font-semibold text-navy">
            User name
            <input
              name="username"
              value={username}
              readOnly
              autoComplete="username"
              className={`${fieldClass} bg-paper text-muted`}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-navy">
            TV number
            <select name="tv" value={tv} onChange={(event) => setTv(event.target.value)} className={fieldClass}>
              <option value="all">All (plays every item)</option>
              {Array.from({ length: totalTvs }, (_, index) => index + 1).map((number) => (
                <option key={number} value={number}>
                  TV {number}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-navy">
            Password
            <input
              required
              autoFocus
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-[5px] bg-navy px-5 py-3 text-sm font-bold text-white uppercase disabled:opacity-60"
          >
            {sending ? "Starting…" : "Start playing"}
          </button>
        </form>
      </div>

      {notice ? (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/60 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tv-notice-title"
            aria-describedby="tv-notice-text"
            className="w-full max-w-sm bg-white p-6 shadow-lg"
          >
            <h2 id="tv-notice-title" className="font-display text-xl font-bold text-navy">
              {notice.reason === "limit" ? "TV limit reached" : "TV number in use"}
            </h2>
            <p id="tv-notice-text" className="mt-2 text-sm text-muted">
              {notice.message}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setNotice(null)}
              className="mt-5 w-full rounded-[5px] bg-gold px-5 py-2.5 text-sm font-bold text-navy uppercase"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
