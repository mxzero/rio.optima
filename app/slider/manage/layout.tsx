import { pageGuard } from "@/lib/server/guards";

export default async function ManageLayout({ children }: LayoutProps<"/slider/manage">) {
  const { notice } = await pageGuard("slider", "/slider/manage");
  return notice ?? children;
}
