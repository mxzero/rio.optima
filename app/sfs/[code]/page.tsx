import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import FullscreenView from "@/components/slider/FullscreenView";
import TvLogin from "@/components/slider/TvLogin";
import { canUseSlider } from "@/lib/auth";
import { HEARTBEAT_SECONDS, resumeScreen } from "@/lib/server/screens";
import { listTvPlaylist } from "@/lib/server/slides";
import { findUserByTvCode } from "@/lib/server/users";

export const metadata: Metadata = {
  title: "SLIDER player",
  robots: { index: false, follow: false },
};

// TV player link, like /sfs/K7M. A TV signs in once (password and TV number)
// and then plays that TV's media; see lib/server/screens.ts for the TV limits.
// Codes of missing or inactive accounts go to the SLIDER page with a notice.
export default async function TvPlayerPage({ params }: PageProps<"/sfs/[code]">) {
  await connection();
  const code = (await params).code.toUpperCase();
  const owner = await findUserByTvCode(code).catch(() => null);
  if (!owner || !canUseSlider(owner)) redirect("/slider?account=inactive");

  const screen = await resumeScreen(owner);
  if (screen && !screen.busy) {
    return (
      <FullscreenView
        screen={{ tv: screen.tv, heartbeatSeconds: HEARTBEAT_SECONDS }}
        slides={await listTvPlaylist(owner, screen.tv)}
      />
    );
  }
  return (
    <TvLogin
      code={code}
      username={owner.email}
      totalTvs={owner.totalTvs}
      lastTv={screen?.tv}
      notice={screen?.busy ? { message: screen.busy.message, reason: screen.busy.reason } : undefined}
    />
  );
}
