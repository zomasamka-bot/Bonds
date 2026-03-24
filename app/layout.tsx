import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Made with App Studio",
  description:
    "Institutional records to document and track bond issuance or allocation intents within governance frameworks on the Pi Network",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bonds",
  },
    generator: 'v0.app'
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4a5f7f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        {/*
          Pi Network SDK — loaded as a static script tag in <head> so that:
          1. The Pi Developer Portal Step 10 checker can detect it on page load.
          2. The Pi Browser (which pre-injects window.Pi natively) ignores the
             tag without breaking anything.
          Pi.init() is NOT called here inline; the auth context handles that
          at runtime so it can detect the correct sandbox flag dynamically.
        */}
        <script src="https://sdk.minepi.com/pi-sdk.js" async />
      </head>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
