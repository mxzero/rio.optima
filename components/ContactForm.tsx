"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { brand } from "@/lib/brand";

export default function ContactForm() {
  const searchParams = useSearchParams();
  const defaultProduct = searchParams.get("product") === "slidify" ? "Slidify" : "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const subjectHint = useMemo(
    () => (defaultProduct ? `Inquiry: ${defaultProduct}` : "Inquiry"),
    [defaultProduct],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to send the message.");
      }
      setStatus("sent");
      setMessage("Thank you. Your message has been received. We will reply using the email you provided.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send the message.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 shadow-sm md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Full name
          <input
            required
            name="name"
            placeholder="Jane Dela Cruz"
            className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal text-ink"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Organization
          <input
            name="organization"
            placeholder="Company or agency"
            className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal text-ink"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Email
          <input
            required
            type="email"
            name="email"
            placeholder={brand.emails.info}
            className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal text-ink"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Phone
          <input
            name="phone"
            placeholder={brand.phones.mobile}
            className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal text-ink"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Interest
        <select
          name="interest"
          defaultValue={defaultProduct}
          className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal text-ink"
        >
          <option value="">Select a service</option>
          <option>Technical solutions</option>
          <option>Project management</option>
          <option>Slidify</option>
          <option>Other</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy">
        Message
        <textarea
          required
          name="message"
          rows={5}
          placeholder={`${subjectHint} — tell us about the program, timeline, and outcome you need.`}
          className="rounded-[5px] border border-navy/20 px-3 py-2.5 font-normal text-ink"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-[5px] bg-gold px-6 py-3 text-sm font-bold text-navy uppercase disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-teal"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
