import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import FullscreenView from "@/components/slider/FullscreenView";
import { findPlayerOwner, listSlidesFor } from "@/lib/server/slides";

export const metadata: Metadata = {
  title: "SLIDER player",
  robots: { index: false, follow: false },
};

// Public player link: no login. Plays the owner's playlist while their account
// is active; otherwise sends visitors to the SLIDER page with a notice.
export default async function PublicPlayerPage({ params }: PageProps<"/slider/fullscreen/[key]">) {
  await connection();
  const { key } = await params;
  const owner = await findPlayerOwner(key).catch(() => null);
  if (!owner) redirect("/slider?account=inactive");
  return <FullscreenView publicKey={key} slides={await listSlidesFor(owner)} />;
}
