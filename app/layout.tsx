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
        <span className="tagline">a register for finding a time everyone keeps</span>
      </div>
    </header>
  );
}
