import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slidify",
  description:
    "Slidify by RIO OPTIMA INC. Play images, YouTube videos, and URLs on any screen.",
};

export default function SlidifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
