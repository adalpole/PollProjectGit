"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { localizeApiError, useLanguage } from "../lib/i18n";
import type { Slot } from "../lib/types";

type EditableSlot = Slot & { id: string };

const TIME_OPTIONS = Array.from({ length: 24 * 12 }, (_, index) => {
  const hours = Math.floor(index / 12)
    .toString()
    .padStart(2, "0");
  const minutes = ((index % 12) * 5).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});

function newSlot(): EditableSlot {
  return {
    id: crypto.randomUUID(),
    date: "",
    start: "09:00",
    end: "09:30",
  };
}

export default function HomePage() {
  const { language, t } = useLanguage();
  const [title, setTitle] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [slots, setSlots] = useState<EditableSlot[]>([newSlot()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validSlots = useMemo(
    () => slots.filter((slot) => slot.date && slot.start && slot.end),
    [slots],
  );
  const canCreate = title.trim().length > 0 && validSlots.length > 0 && !saving;

  function addSlot() {
    setSlots((current) => [...current, newSlot()]);
  }

  function removeSlot(id: string) {
    setSlots((current) => (current.length === 1 ? current : current.filter((slot) => slot.id !== id)));
  }

  function updateSlot(id: string, field: keyof Slot, value: string) {
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)),
    );
  }

  async function createPoll() {
    if (!canCreate) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          organizer_email: organizerEmail.trim() || null,
          slots: validSlots.map(({ date, start, end }) => ({ date, start, end })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { id: string; organizer_token: string; error?: string }
        | null;

      if (!response.ok || !payload?.id || !payload.organizer_token) {
        throw new Error(localizeApiError(payload?.error, language, t("errorCreatePoll")));
      }

      const recoveryParam = organizerEmail.trim() ? "?recovery=1" : "";
      window.location.assign(`/e/${payload.id}/${payload.organizer_token}${recoveryParam}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorCreatePoll"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section fadein">
      <p className="page-kicker sans">{t("createPollKicker")}</p>
      <h1 className="page-title">{t("proposeMeeting")}</h1>

      <label className="field-label sans" htmlFor="title">
        {t("title")}
      </label>
      <input
        id="title"
        className="text-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={t("titlePlaceholder")}
      />

      <div style={{ height: 22 }} />

      <label className="field-label sans" htmlFor="organizer-email">
        {t("organizerEmailOptional")}
      </label>
      <input
        id="organizer-email"
        className="text-input sans"
        value={organizerEmail}
        onChange={(event) => setOrganizerEmail(event.target.value)}
        placeholder={t("organizerEmailPlaceholder")}
        type="email"
      />
      <p className="field-help sans">
        {t("organizerEmailHelp")}
      </p>

      <div style={{ height: 24 }} />

      <label className="field-label sans">{t("proposedSlots")}</label>
      <div className="slot-list">
        {slots.map((slot) => (
          <div className="slot-row sans" key={slot.id}>
            <input
              aria-label={t("date")}
              type="date"
              value={slot.date}
              onChange={(event) => updateSlot(slot.id, "date", event.target.value)}
            />
            <select
              aria-label={t("startTime")}
              value={slot.start}
              onChange={(event) => updateSlot(slot.id, "start", event.target.value)}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <span aria-hidden="true" style={{ color: "var(--muted)" }}>
              -
            </span>
            <select
              aria-label={t("endTime")}
              value={slot.end}
              onChange={(event) => updateSlot(slot.id, "end", event.target.value)}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <button
              className="icon-button"
              type="button"
              aria-label={t("removeSlot")}
              title={t("removeSlot")}
              onClick={() => removeSlot(slot.id)}
              disabled={slots.length === 1}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button className="button button-secondary" type="button" onClick={addSlot} style={{ marginTop: 14 }}>
        <Plus size={15} />
        {t("addSlot")}
      </button>

      <div style={{ marginTop: 24 }}>
        <button className="button" type="button" disabled={!canCreate} onClick={createPoll}>
          {saving ? t("creating") : t("createPoll")}
        </button>
      </div>
      <p className="privacy-hint sans">
        {t("pollDataPrefix")} <a href="/privacy">{t("privacyPolicy")}</a>.
      </p>

      <p className="small-action sans">
        {t("lostOrganizerLink")} <a href="/recover">{t("recoverPolls")}</a>.
      </p>

      {error ? <p className="error-text sans">{error}</p> : null}
    </section>
  );
}
