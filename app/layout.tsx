import type { Metadata } from "next";
import "./globals.css";

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
        <Header />
        <main className="shell">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href="/">
          <img className="brand-mark" src="/polipol-icon.png" alt="" aria-hidden="true" />
          <span>PoliPol</span>
        </a>
        <span className="version-badge sans">v3.4.1</span>
        <span className="tagline">a register for finding a time everyone keeps</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer sans">
      <span>PoliPol v3.4.1</span>
      <nav className="site-footer__links" aria-label="Legal links">
        <a href="/privacy">Privacy policy</a>
        <a href="/cookies">Cookie policy</a>
      </nav>
    </footer>
  );
}
