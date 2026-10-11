"use client";

import { useEffect, useState } from "react";
import ManageMedia from "@/components/slider/ManageMedia";
import SliderNav from "@/components/slider/SliderNav";
import SliderOverview from "@/components/slider/SliderOverview";
import AccessNotice from "@/components/AccessNotice";
import { SessionUser, canUseSlider } from "@/lib/auth";

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
