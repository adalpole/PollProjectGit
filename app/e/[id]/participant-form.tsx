"use client";

import { Check, Circle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatSlot } from "../../../lib/format";
import type { AvailabilityStatus, PublicEvent } from "../../../lib/types";

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

  const canSubmit = useMemo(
    () => organization.trim().length > 0 && email.trim().length > 0 && !saving,
    [email, organization, saving],
  );

  function setSlotStatus(index: number, status: AvailabilityStatus) {
    setAvailability((current) => current.map((value, i) => (i === index ? status : value)));
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

      <div className="availability-list">
        {event.slots.map((slot, index) => {
          const formatted = formatSlot(slot);
          const status = availability[index];
          return (
            <div className="availability-row" key={`${slot.date}-${slot.start}-${index}`}>
              <div>
                <div className="slot-day">{formatted.day}</div>
                <div className="slot-time mono">{formatted.time}</div>
              </div>
              <div className="status-group">
                <StatusButton
                  label="Yes"
                  status="yes"
                  active={status === "yes"}
                  onClick={() => setSlotStatus(index, "yes")}
                />
                <StatusButton
                  label="Maybe"
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

      {error ? <p className="error-text sans">{error}</p> : null}
      {success ? <p className="success-text sans">{success}</p> : null}
    </section>
  );
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
