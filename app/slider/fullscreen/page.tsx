import FullscreenView from "@/components/slider/FullscreenView";
import { pageGuard } from "@/lib/server/guards";

// Signed-in player. The public, no-login player lives at ./[key].
export default async function FullscreenPage() {
  const { notice } = await pageGuard("slider", "/slider/fullscreen");
  return notice ?? <FullscreenView />;
}
