import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "./site-chrome";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://polipol.it";
const siteDescription = "Create lightweight scheduling polls, share one link, and pick a time.";
const socialImage = "/og.png";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "PoliPol",
    template: "%s | PoliPol",
  },
  description: siteDescription,
  applicationName: "PoliPol",
  creator: "PoliPol",
  publisher: "PoliPol",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PoliPol",
    description: siteDescription,
    url: "/",
    siteName: "PoliPol",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "PoliPol scheduling poll preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoliPol",
    description: siteDescription,
    images: [socialImage],
  },
  icons: {
    icon: "/polipol-icon.png",
    apple: "/polipol-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
