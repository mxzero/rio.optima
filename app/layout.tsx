import type { Metadata } from "next";
import { Montserrat, Source_Sans_3 } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { brand } from "@/lib/brand";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.legalName} | Technical and Project Management Solutions`,
    template: `%s | ${brand.legalName}`,
  },
  description:
    "RIO OPTIMA INC. provides technical, project management, and logistics solutions, including SLIDER digital signage for screens and playlists.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
