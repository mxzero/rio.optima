import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SLIDER",
  description:
    "SLIDER by RIO OPTIMA INC. Play images, YouTube videos, and URLs on any screen.",
};

export default function SliderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
