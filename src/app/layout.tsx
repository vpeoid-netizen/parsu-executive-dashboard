import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Partido State University Executive Dashboard",
    template: "%s | ParSU Executive Dashboard",
  },
  description:
    "Official executive analytics and institutional information platform of Partido State University.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#071f46",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${outfit.variable} h-full overflow-x-clip antialiased`}
    >
      <body className="min-h-full overflow-x-clip bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
