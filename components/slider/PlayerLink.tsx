"use client";

import { useEffect, useState } from "react";
import { SessionUser, canUseSlider, playerPath } from "@/lib/auth";

// The signed-in user's TV player URL, with a copy button.
export default function PlayerLink() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: SessionUser | null }) => {
        if (canUseSlider(data.user)) setUrl(window.location.origin + playerPath(data.user!));
      })
      .catch(() => {});
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API blocked (e.g. non-HTTPS): fall back to a selection copy.
      const field = document.createElement("textarea");
      field.value = url;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!url) return null;

  return (
    <div className="mt-3 max-w-3xl">
      <p className="text-xs font-semibold text-muted">TV player link: open it on a TV, pick a TV number and enter your password</p>
      <div className="mt-1.5 flex items-stretch overflow-hidden rounded-[5px] border border-navy/20 bg-white">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate px-3 py-2 font-mono text-sm text-teal hover:text-navy"
          title={url}
        >
          {url}
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy player link"
          title={copied ? "Copied!" : "Copy link"}
          className="flex shrink-0 items-center gap-1.5 border-l border-navy/20 bg-paper px-3 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="2.5" d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <path fill="none" stroke="currentColor" strokeWidth="2" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          )}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
