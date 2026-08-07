import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SkipLink } from "@/components/ui/SkipLink";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://mymuseum.example.com";

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
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
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
