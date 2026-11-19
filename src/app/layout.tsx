import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "It’s almost…",
  description: "A cozy little countdown to whatever you’re waiting for. Type a thing, pick a time, watch the frost melt.",
};

export const viewport: Viewport = {
  themeColor: "#0a1129",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
