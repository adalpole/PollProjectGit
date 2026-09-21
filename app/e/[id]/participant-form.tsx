"use client";

import { Check, Circle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatSlot } from "../../../lib/format";
import { localizeApiError, useLanguage } from "../../../lib/i18n";
import { createEmptyResponseSummary, normalizePublicEvent } from "../../../lib/response-summary";
import type {
  AvailabilityStatus,
  PublicEvent,
  PublicResponseSummary,
  PublicSlotPreference,
} from "../../../lib/types";

export default function ParticipantForm({ event }: { event: PublicEvent }) {
  const { language, locale, t } = useLanguage();
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus[]>(
    event.slots.map(() => "no"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [responseSummary, setResponseSummary] = useState<PublicResponseSummary>(
    () => event.response_summary ?? createEmptyResponseSummary(event.slots),
  );

  const canSubmit = useMemo(
    () => organization.trim().length > 0 && email.trim().length > 0 && !saving,
    [email, organization, saving],
  );

  const preferencesBySlot = useMemo(
    () => new Map(responseSummary.slots.map((preference) => [preference.slot_index, preference])),
    [responseSummary],
  );

  useEffect(() => {
    setResponseSummary(event.response_summary ?? createEmptyResponseSummary(event.slots));
  }, [event.response_summary, event.slots]);

  function setSlotStatus(index: number, status: AvailabilityStatus) {
    setAvailability((current) => current.map((value, i) => (i === index ? status : value)));
  }

  async function refreshResponseSummary() {
    const response = await fetch(`/api/events/${event.id}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as PublicEvent | { error?: string } | null;

    if (!response.ok || !isPublicEvent(payload)) return;

    const nextEvent = normalizePublicEvent(payload);
    if (nextEvent.response_summary) {
      setResponseSummary(nextEvent.response_summary);
    }
  }

  async function submit() {
    if (!canSubmit) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/events/${event.id}/responses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          participant_name: name.trim() || null,
          organization: organization.trim(),
          email: email.trim(),
          availability,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(localizeApiError(payload?.error, language, t("errorRecordResponse")));
      }

      setSuccess(t("responseRecorded"));
      await refreshResponseSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorRecordResponse"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section fadein">
      <h1 className="page-title" style={{ marginBottom: 4 }}>
        {event.title}
      </h1>
      <p className="page-kicker sans" style={{ marginBottom: 24 }}>
        {t("addAvailability")}
      </p>

      <ConfirmedSlotNotice event={event} />

      <div className="respond-fields">
        <div>
          <label className="field-label sans" htmlFor="name">
            {t("nameOptional")}
          </label>
          <input
            id="name"
            className="text-input sans"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("yourName")}
          />
        </div>
        <div>
          <label className="field-label sans" htmlFor="organization">
            {t("organization")}
          </label>
          <input
            id="organization"
            className="text-input sans"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            placeholder={t("organizationPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="field-label sans" htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            className="text-input sans"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.org"
            type="email"
            required
          />
        </div>
      </div>

      <PreferencePanel totalResponses={responseSummary.total_responses} />

      <div className="availability-list">
        {event.slots.map((slot, index) => {
          const formatted = formatSlot(slot, locale);
          const status = availability[index];
          const preference = preferencesBySlot.get(index) ?? createEmptySlotPreference(index);
          return (
            <div className="availability-row" key={`${slot.date}-${slot.start}-${index}`}>
              <div className="slot-meta">
                <div className="slot-day">{formatted.day}</div>
                <div className="slot-time mono">{formatted.time}</div>
              </div>
              {responseSummary.total_responses > 0 ? (
                <SlotPreferenceChart preference={preference} totalResponses={responseSummary.total_responses} />
              ) : null}
              <div className="status-group">
                <StatusButton
                  label={t("yes")}
                  status="yes"
                  active={status === "yes"}
                  onClick={() => setSlotStatus(index, "yes")}
                />
                <StatusButton
                  label={t("ifNeeded")}
                  status="maybe"
                  active={status === "maybe"}
                  onClick={() => setSlotStatus(index, "maybe")}
                />
                <StatusButton
                  label={t("no")}
                  status="no"
                  active={status === "no"}
                  onClick={() => setSlotStatus(index, "no")}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="button" type="button" disabled={!canSubmit} onClick={submit} style={{ marginTop: 22 }}>
        {saving ? t("submitting") : t("submitResponse")}
      </button>
      <p className="privacy-hint sans">
        {t("submitPrivacyPrefix")} {" "}
        <a href="/privacy" target="_blank" rel="noreferrer">
          {t("privacyPolicy")}
        </a>
        .
      </p>

      {error ? <p className="error-text sans">{error}</p> : null}
      {success ? (
        <p className="success-text sans">
          <span>{success}</span>
          <span className="success-text__hint">
            {t("responseChangeHint")}
          </span>
        </p>
      ) : null}
    </section>
  );
}

function ConfirmedSlotNotice({ event }: { event: PublicEvent }) {
  const { locale, t } = useLanguage();
  if (event.confirmed_slot_index === null) {
    return null;
  }

  const selectedSlot = event.slots[event.confirmed_slot_index];

  if (!selectedSlot) {
    return null;
  }

  const formatted = formatSlot(selectedSlot, locale);

  return (
    <div className="confirmed-slot-notice sans">
      <span className="confirmed-slot-notice__label">{t("slotSelected")}</span>
      <span>{t("selectedSlotNotice", { day: formatted.day, time: formatted.time })}</span>
    </div>
  );
}

function isPublicEvent(payload: PublicEvent | { error?: string } | null): payload is PublicEvent {
  return Boolean(
    payload &&
      "id" in payload &&
      "title" in payload &&
      "slots" in payload &&
      "confirmed_slot_index" in payload,
  );
}

function createEmptySlotPreference(index: number): PublicSlotPreference {
  return {
    slot_index: index,
    yes_count: 0,
    if_needed_count: 0,
    no_count: 0,
    answer_count: 0,
  };
}

function PreferencePanel({ totalResponses }: { totalResponses: number }) {
  const { t } = useLanguage();
  const responseLabel =
    totalResponses === 1 ? t("oneResponse") : t("manyResponses", { count: totalResponses });

  return (
    <div className={`preference-panel sans ${totalResponses === 0 ? "preference-panel--empty" : ""}`}>
      <span className="preference-panel__label">{t("preferencesSoFar")}</span>
      <span>{totalResponses > 0 ? responseLabel : t("noPreferences")}</span>
    </div>
  );
}

function SlotPreferenceChart({
  preference,
  totalResponses,
}: {
  preference: PublicSlotPreference;
  totalResponses: number;
}) {
  const { t } = useLanguage();
  const yesLabel = t("yesCount", { count: preference.yes_count });
  const ifNeededLabel = t("ifNeededCount", { count: preference.if_needed_count });
  const noLabel = t("noCount", { count: preference.no_count });
  const chartLabel = t("chartLabel", {
    answers: preference.answer_count,
    total: totalResponses,
    yes: yesLabel,
    maybe: ifNeededLabel,
    no: noLabel,
  });

  return (
    <div className="preference-chart sans" aria-label={chartLabel}>
      <span
        className="preference-chart__pie"
        style={{ background: buildPreferenceGradient(preference, totalResponses) }}
        aria-hidden="true"
      />
      <span className="preference-chart__copy">
        <span className="preference-chart__total">
          {t("choseThis", { answers: preference.answer_count, total: totalResponses })}
        </span>
        <span className="preference-chart__legend" aria-hidden="true">
          <span>
            <i className="legend-dot legend-dot--yes" />
            {yesLabel}
          </span>
          <span>
            <i className="legend-dot legend-dot--maybe" />
            {ifNeededLabel}
          </span>
          <span>
            <i className="legend-dot legend-dot--no" />
            {noLabel}
          </span>
        </span>
      </span>
    </div>
  );
}

function buildPreferenceGradient(preference: PublicSlotPreference, totalResponses: number) {
  const total = Math.max(totalResponses, 1);
  const yesEnd = (preference.yes_count / total) * 100;
  const ifNeededEnd = ((preference.yes_count + preference.if_needed_count) / total) * 100;

  return [
    "conic-gradient(",
    `var(--chart-yes) 0 ${yesEnd.toFixed(2)}%, `,
    `var(--chart-if-needed) ${yesEnd.toFixed(2)}% ${ifNeededEnd.toFixed(2)}%, `,
    `var(--chart-no) ${ifNeededEnd.toFixed(2)}% 100%`,
    ")",
  ].join("");
}

function StatusButton({
  label,
  status,
  active,
  onClick,
}: {
  label: string;
  status: AvailabilityStatus;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = status === "yes" ? Check : status === "maybe" ? Circle : X;

  return (
    <button
      className={`status-button status-button--${status}`}
      data-active={active}
      type="button"
      title={label}
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon size={status === "maybe" ? 11 : 13} fill={status === "maybe" && active ? "currentColor" : "none"} />
      {label}
    </button>
  );
}
