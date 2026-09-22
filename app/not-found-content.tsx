"use client";

import { ArrowLeft, Link2Off, Mail } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export function NotFoundContent() {
  const { t } = useLanguage();

  return (
    <section className="section fadein not-found-page">
      <div className="not-found-icon" aria-hidden="true">
        <Link2Off size={24} />
      </div>
      <p className="page-kicker sans">404</p>
      <h1 className="page-title">{t("notFoundTitle")}</h1>
      <p className="not-found-copy sans">{t("notFoundCopy")}</p>
      <div className="not-found-actions sans">
        <a className="button" href="/">
          <ArrowLeft size={15} />
          {t("returnHome")}
        </a>
        <a className="button button-secondary" href="/recover">
          <Mail size={15} />
          {t("recoverOrganizerLinks")}
        </a>
      </div>
    </section>
  );
}
