import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoliPol",
  description: "A lightweight group scheduling poll for academic coordination.",
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
        <span className="version-badge sans">v3.3</span>
        <span className="tagline">a register for finding a time everyone keeps</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer sans">
      <span>PoliPol v3.3</span>
      <nav className="site-footer__links" aria-label="Legal links">
        <a href="/privacy">Privacy policy</a>
        <a href="/cookies">Cookie policy</a>
      </nav>
    </footer>
  );
}
