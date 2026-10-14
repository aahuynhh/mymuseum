import type { Metadata } from "next";
import { Fraunces, Fredoka, Nunito } from "next/font/google";
import { SkipLink } from "@/components/ui/SkipLink";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Reserved for actual artwork plaques only (components/ui/Plaque.tsx,
// components/landing/ExhibitionWallPiece.tsx) -- the one place the site
// keeps its elegant serif voice. Everything else uses Fredoka/Nunito below.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// Headings, buttons, and navigation -- the playful, rounded voice of the
// site's UI chrome.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Body copy and descriptions.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MyMuseum — Build a world for your work.",
    template: "%s · MyMuseum",
  },
  description:
    "Create a personal virtual museum, share your portfolio, and explore art alongside friends.",
  openGraph: {
    title: "MyMuseum — Build a world for your work.",
    description:
      "Create a personal virtual museum, share your portfolio, and explore art alongside friends.",
    siteName: "MyMuseum",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyMuseum — Build a world for your work.",
    description:
      "Create a personal virtual museum, share your portfolio, and explore art alongside friends.",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <MotionProvider>
          <SkipLink />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
