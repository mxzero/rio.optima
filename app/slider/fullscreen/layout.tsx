import { pageGuard } from "@/lib/server/guards";

export default async function FullscreenLayout({ children }: LayoutProps<"/slider/fullscreen">) {
  const { notice } = await pageGuard("slider", "/slider/fullscreen");
  return notice ?? children;
}
