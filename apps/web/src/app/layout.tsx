import type { Metadata } from "next";
import { Lato } from "next/font/google";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

/*
  Lato at 400/700 — Google Fonts' Lato has no 500, so "Medium" in the design
  maps to 400 (Regular body/labels, Bold titles and buttons) rather than
  synthesizing a faux weight.
  `display: "swap"` plus next/font's self-hosting keeps the fallback flash off
  the fidelity checklist without blocking first paint.
*/
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DEALPORT",
    template: "%s · DEALPORT",
  },
  description: "DEALPORT admin — products, inventory and sales reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
