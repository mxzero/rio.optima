"use client";

import { useEffect, useState } from "react";
import ManageMedia from "@/components/slider/ManageMedia";
import SliderNav from "@/components/slider/SliderNav";
import SliderOverview from "@/components/slider/SliderOverview";

export default function SliderHomePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: { name: string } | null }) => setLoggedIn(Boolean(data.user)))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <div className="bg-paper">
      <SliderNav />
      {loggedIn === null ? (
        <p className="site-container py-16 text-muted">Loading SLIDER…</p>
      ) : loggedIn ? (
        <ManageMedia />
      ) : (
        <SliderOverview />
      )}
    </div>
  );
}
