import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convene",
  description: "A self-hosted group scheduling register.",
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
          Convene
        </a>
        <span className="version-badge sans">v2</span>
        <span className="tagline">a register for finding a time everyone keeps</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer sans">
      Convene v2. This poll was developed by Adalberto Polenghi independently from
      Politecnico di Milano.
    </footer>
  );
}
