"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ManageMedia from "@/components/slider/ManageMedia";
import SliderNav from "@/components/slider/SliderNav";
import SliderOverview from "@/components/slider/SliderOverview";
import AccessNotice from "@/components/AccessNotice";
import { SessionUser, canUseSlider } from "@/lib/auth";

// Shown when a TV player link belongs to a missing or deactivated account.
function AccountNotice() {
  const params = useSearchParams();
  if (params.get("account") !== "inactive") return null;
  return (
    <div className="site-container pt-8">
      <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
        You do not have an active account.
      </p>
    </div>
  );
}

export default function SliderHomePage() {
  // undefined while loading, null when signed out.
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: SessionUser | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="bg-paper">
      <SliderNav />
      <Suspense fallback={null}>
        <AccountNotice />
      </Suspense>
      {user === undefined ? (
        <p className="site-container py-16 text-muted">Loading SLIDER…</p>
      ) : canUseSlider(user) ? (
        <ManageMedia />
      ) : user ? (
        <AccessNotice
          title="SLIDER isn't on your account"
          message="Your account is set up for TMS, which isn't available yet. Ask an admin to switch your service to Slider."
        />
      ) : (
        <SliderOverview />
      )}
    </div>
  );
}
