"use client";

import { LanguageProvider, useLanguage, type Language } from "../lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Header />
      <main className="shell">{children}</main>
      <Footer />
    </LanguageProvider>
  );
}

function Header() {
  const { t } = useLanguage();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand-row">
          <a className="brand" href="/">
            <img className="brand-mark" src="/polipol-icon.png" alt="" aria-hidden="true" />
            <span>PoliPol</span>
          </a>
          <span className="version-badge sans">v4.0.5</span>
        </div>
        <span className="tagline">{t("tagline")}</span>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-switcher sans" role="group" aria-label={t("language")}>
      {(["en", "it"] as Language[]).map((option) => (
        <button
          key={option}
          type="button"
          data-active={language === option}
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer sans">
      <span>PoliPol v4.0.5</span>
      <nav className="site-footer__links" aria-label={t("legalLinks")}>
        <a href="/privacy">{t("privacyPolicy")}</a>
        <a href="/cookies">{t("cookiePolicy")}</a>
      </nav>
    </footer>
  );
}
