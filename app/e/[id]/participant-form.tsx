"use client";

import { Check, Circle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatSlot } from "../../../lib/format";
import { createEmptyResponseSummary, normalizePublicEvent } from "../../../lib/response-summary";
import type {
  AvailabilityStatus,
  PublicEvent,
  PublicResponseSummary,
  PublicSlotPreference,
} from "../../../lib/types";

export default function ParticipantForm({ event }: { event: PublicEvent }) {
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
        throw new Error(payload?.error || "Could not record your response.");
      }

      setSuccess("Thanks - your response has been recorded.");
      await refreshResponseSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your response.");
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
        Add your availability for the proposed slots.
      </p>

      <div className="respond-fields">
        <div>
          <label className="field-label sans" htmlFor="name">
            Name optional
          </label>
          <input
            id="name"
            className="text-input sans"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="field-label sans" htmlFor="organization">
            Organization
          </label>
          <input
            id="organization"
            className="text-input sans"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            placeholder="Your institution or team"
            required
          />
        </div>
        <div>
          <label className="field-label sans" htmlFor="email">
            Email
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
          const formatted = formatSlot(slot);
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
                  label="Yes"
                  status="yes"
                  active={status === "yes"}
                  onClick={() => setSlotStatus(index, "yes")}
                />
                <StatusButton
                  label="If needed"
                  status="maybe"
                  active={status === "maybe"}
                  onClick={() => setSlotStatus(index, "maybe")}
                />
                <StatusButton
                  label="No"
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
        {saving ? "Submitting..." : "Submit response"}
      </button>
      <p className="privacy-hint sans">
        By submitting, your response is stored for this poll and visible to the organizer. See the{" "}
        <a href="/privacy" target="_blank" rel="noreferrer">
          Privacy policy
        </a>
        .
      </p>

      {error ? <p className="error-text sans">{error}</p> : null}
      {success ? (
        <p className="success-text sans">
          <span>{success}</span>
          <span className="success-text__hint">
            You can change your answers and submit again as long as you keep this page open.
          </span>
        </p>
      ) : null}
    </section>
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
  const responseLabel =
    totalResponses === 1 ? "1 response so far" : `${totalResponses} responses so far`;

  return (
    <div className={`preference-panel sans ${totalResponses === 0 ? "preference-panel--empty" : ""}`}>
      <span className="preference-panel__label">Preferences so far</span>
      <span>{totalResponses > 0 ? responseLabel : "No previous preferences yet."}</span>
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
  const yesLabel = preference.yes_count === 1 ? "1 yes" : `${preference.yes_count} yes`;
  const ifNeededLabel =
    preference.if_needed_count === 1
      ? "1 if needed"
      : `${preference.if_needed_count} if needed`;
  const noLabel = preference.no_count === 1 ? "1 no" : `${preference.no_count} no`;
  const chartLabel = `${preference.answer_count} of ${totalResponses} respondents chose this slot: ${yesLabel}, ${ifNeededLabel}, ${noLabel}.`;

  return (
    <div className="preference-chart sans" aria-label={chartLabel}>
      <span
        className="preference-chart__pie"
        style={{ background: buildPreferenceGradient(preference, totalResponses) }}
        aria-hidden="true"
      />
      <span className="preference-chart__copy">
        <span className="preference-chart__total">
          {preference.answer_count}/{totalResponses} chose this
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
