"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Slot } from "../lib/types";

type EditableSlot = Slot & { id: string };

function newSlot(): EditableSlot {
  return {
    id: crypto.randomUUID(),
    date: "",
    start: "09:00",
    end: "09:30",
  };
}

export default function HomePage() {
  const [title, setTitle] = useState("");
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
          slots: validSlots.map(({ date, start, end }) => ({ date, start, end })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { id: string; organizer_token: string; error?: string }
        | null;

      if (!response.ok || !payload?.id || !payload.organizer_token) {
        throw new Error(payload?.error || "Could not create the poll.");
      }

      window.location.assign(`/e/${payload.id}/${payload.organizer_token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the poll.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section fadein">
      <p className="page-kicker sans">Create a poll</p>
      <h1 className="page-title">Propose a meeting</h1>

      <label className="field-label sans" htmlFor="title">
        Title
      </label>
      <input
        id="title"
        className="text-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Partner sync - curriculum review"
      />

      <div style={{ height: 30 }} />

      <label className="field-label sans">Proposed slots</label>
      <div className="slot-list">
        {slots.map((slot) => (
          <div className="slot-row sans" key={slot.id}>
            <input
              aria-label="Date"
              type="date"
              value={slot.date}
              onChange={(event) => updateSlot(slot.id, "date", event.target.value)}
            />
            <input
              aria-label="Start time"
              type="time"
              value={slot.start}
              onChange={(event) => updateSlot(slot.id, "start", event.target.value)}
            />
            <span aria-hidden="true" style={{ color: "var(--muted)" }}>
              -
            </span>
            <input
              aria-label="End time"
              type="time"
              value={slot.end}
              onChange={(event) => updateSlot(slot.id, "end", event.target.value)}
            />
            <button
              className="icon-button"
              type="button"
              aria-label="Remove slot"
              title="Remove slot"
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
        Add another slot
      </button>

      <div style={{ marginTop: 24 }}>
        <button className="button" type="button" disabled={!canCreate} onClick={createPoll}>
          {saving ? "Creating..." : "Create poll"}
        </button>
      </div>

      {error ? <p className="error-text sans">{error}</p> : null}
    </section>
  );
}
