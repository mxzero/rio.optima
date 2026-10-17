import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import FullscreenView from "@/components/slider/FullscreenView";
import { findPlayerOwner, listSlidesFor } from "@/lib/server/slides";

export const metadata: Metadata = {
  title: "SLIDER player",
  robots: { index: false, follow: false },
};

// Short public player link for TVs, like /sfs/K7M: no login. Plays the owner's
// playlist while their account is active; otherwise sends visitors to the
// SLIDER page with a notice.
export default async function TvPlayerPage({ params }: PageProps<"/sfs/[code]">) {
  await connection();
  const code = (await params).code.toUpperCase();
  const owner = await findPlayerOwner(code).catch(() => null);
  if (!owner) redirect("/slider?account=inactive");
  return <FullscreenView publicKey={code} slides={await listSlidesFor(owner)} />;
}
