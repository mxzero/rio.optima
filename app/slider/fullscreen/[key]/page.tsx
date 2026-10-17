import { redirect } from "next/navigation";
import { connection } from "next/server";
import { findPlayerOwner } from "@/lib/server/slides";

// Player links from before TV codes (/slider/fullscreen/sam-sub-RIO-7K2QX)
// now go to the account's /sfs/<code> sign-in.
export default async function OldPlayerLinkPage({ params }: PageProps<"/slider/fullscreen/[key]">) {
  await connection();
  const owner = await findPlayerOwner((await params).key).catch(() => null);
  redirect(owner ? `/sfs/${owner.tvCode}` : "/slider?account=inactive");
}
