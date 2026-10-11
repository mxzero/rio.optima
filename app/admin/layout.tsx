import type { Metadata } from "next";
import { pageGuard } from "@/lib/server/guards";

export const metadata: Metadata = {
  title: "Admin console",
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { notice } = await pageGuard("admin", "/admin");
  return notice ?? children;
}
