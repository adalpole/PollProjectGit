"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { localizeApiError, useLanguage } from "../../lib/i18n";

export default function RecoverPage() {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submitRecovery() {
    if (!email.trim() || sending) return;

    setSending(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/recover", {
        method: "POST",
        headers: {
          "accept-language": language,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), language }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(localizeApiError(payload?.error, language, t("errorRecovery")));
      }

      setStatus(payload?.message || t("recoveryGeneric"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorRecovery"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="section fadein">
      <a className="back-link sans" href="/">
        <ArrowLeft size={14} /> {t("back")}
      </a>

      <p className="page-kicker sans" style={{ marginTop: 28 }}>
        {t("recoveryKicker")}
      </p>
      <h1 className="page-title">{t("recoverTitle")}</h1>

      <div className="recover-panel">
        <Mail size={20} color="var(--primary)" />
        <p className="recover-copy sans">
          {t("recoveryCopy")}
        </p>

        <label className="field-label sans" htmlFor="recovery-email">
          {t("email")}
        </label>
        <input
          id="recovery-email"
          className="text-input sans"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.org"
          type="email"
        />

        <button
          className="button"
          type="button"
          disabled={!email.trim() || sending}
          onClick={submitRecovery}
          style={{ marginTop: 22 }}
        >
          {sending ? t("sending") : t("sendRecovery")}
        </button>
        <p className="privacy-hint sans">
          {t("recoveryPrivacyPrefix")} <a href="/privacy">{t("privacyPolicy")}</a>.
        </p>

        {status ? <p className="success-text sans">{status}</p> : null}
        {error ? <p className="error-text sans">{error}</p> : null}
      </div>
    </section>
  );
}
