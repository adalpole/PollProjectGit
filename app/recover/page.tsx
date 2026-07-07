"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";

export default function RecoverPage() {
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Could not submit recovery request.");
      }

      setStatus(payload?.message || "If we found any polls tied to that email, we've sent the links.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit recovery request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="section fadein">
      <a className="back-link sans" href="/">
        <ArrowLeft size={14} /> Back
      </a>

      <p className="page-kicker sans" style={{ marginTop: 28 }}>
        Organizer link recovery
      </p>
      <h1 className="page-title">Recover your poll links</h1>

      <div className="recover-panel">
        <Mail size={20} color="var(--primary)" />
        <p className="recover-copy sans">
          Enter the organizer email you used when creating a poll. If any polls are tied to that
          email, Convene will send the private organizer links.
        </p>

        <label className="field-label sans" htmlFor="recovery-email">
          Email
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
          {sending ? "Sending..." : "Send recovery email"}
        </button>

        {status ? <p className="success-text sans">{status}</p> : null}
        {error ? <p className="error-text sans">{error}</p> : null}
      </div>
    </section>
  );
}
