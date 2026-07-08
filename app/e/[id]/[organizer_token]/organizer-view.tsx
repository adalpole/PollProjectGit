"use client";

import { Check, Circle, Copy, Download, Trash2, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatSlot, getBestSlotIndex, getSlotAnswerCount } from "../../../../lib/format";
import type { AvailabilityStatus, OrganizerEvent } from "../../../../lib/types";

export default function OrganizerView({
  event,
  token,
  recoveryEnabled = false,
}: {
  event: OrganizerEvent;
  token: string;
  recoveryEnabled?: boolean;
}) {
  const router = useRouter();
  const [copiedLink, setCopiedLink] = useState<"public" | "organizer" | null>(null);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return `/e/${event.id}`;
    return `${window.location.origin}/e/${event.id}`;
  }, [event.id]);
  const organizerUrl = useMemo(() => {
    if (typeof window === "undefined") return `/e/${event.id}/${token}`;
    return `${window.location.origin}/e/${event.id}/${token}`;
  }, [event.id, token]);
  const bestIdx = getBestSlotIndex(event.responses, event.slots.length);

  async function copyLink(kind: "public" | "organizer", url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedLink(kind);
    window.setTimeout(() => setCopiedLink(null), 1800);
  }

  async function selectSlot(slotIndex: number) {
    setBusySlot(slotIndex);
    setError("");

    try {
      const response = await fetch(`/api/events/${event.id}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, slot_index: slotIndex }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Could not select that slot.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not select that slot.");
    } finally {
      setBusySlot(null);
    }
  }

  async function deletePoll() {
    if (!window.confirm("Delete this poll and all responses?")) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Could not delete the poll.");
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the poll.");
      setDeleting(false);
    }
  }

  return (
    <section className="section fadein">
      <p className="page-kicker sans">Organizer view</p>
      <h1 className="page-title" style={{ marginBottom: 16 }}>
        {event.title}
      </h1>

      {recoveryEnabled ? (
        <p className="success-banner sans">
          Link recovery is enabled for this poll. We'll be able to email you this organizer link if
          you lose it.
        </p>
      ) : null}

      <div className="link-panel sans">
        <LinkCard
          kind="public"
          label="Shareable participant link"
          help="Send this link to participants so they can submit or update their availability."
          url={publicUrl}
          copied={copiedLink === "public"}
          onCopy={() => copyLink("public", publicUrl)}
        />
        <LinkCard
          kind="organizer"
          label="Organizer private link"
          help="Keep this link for yourself. It opens results, slot selection, CSV exports, and poll deletion."
          url={organizerUrl}
          copied={copiedLink === "organizer"}
          onCopy={() => copyLink("organizer", organizerUrl)}
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-actions">
          <a className="button" href={`/api/events/${event.id}/export/all?token=${token}`} download>
            <Download size={15} />
            Download all respondents
          </a>
          {event.confirmed_slot_index === null ? (
            <button className="button" type="button" disabled>
              <Download size={15} />
              Download available for selected slot
            </button>
          ) : (
            <a
              className="button"
              href={`/api/events/${event.id}/export/available?token=${token}`}
              download
            >
              <Download size={15} />
              Download available for selected slot
            </a>
          )}
        </div>
      </div>

      {event.responses.length === 0 ? (
        <div className="notice">
          <Users size={20} style={{ opacity: 0.6 }} />
          <p className="sans">No responses yet. Share the link to start collecting availability.</p>
        </div>
      ) : (
        <ResultsTable
          event={event}
          bestIdx={bestIdx}
          busySlot={busySlot}
          onSelectSlot={selectSlot}
        />
      )}

      <div className="export-panel sans">
        <p className="export-note">
          The exported file marks each person as "available" or "if needed" for the selected slot -
          use that column to decide who's required vs. optional when you send the invite.
        </p>
      </div>

      <div className="danger-zone sans">
        <button className="button button-danger" type="button" onClick={deletePoll} disabled={deleting}>
          <Trash2 size={15} />
          {deleting ? "Deleting..." : "Delete poll"}
        </button>
      </div>

      {error ? <p className="error-text sans">{error}</p> : null}
    </section>
  );
}

function LinkCard({
  kind,
  label,
  help,
  url,
  copied,
  onCopy,
}: {
  kind: "public" | "organizer";
  label: string;
  help: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className={`link-card ${kind === "organizer" ? "link-card--private" : ""}`}>
      <div>
        <p className="link-card__label">{label}</p>
        <span className="link-card__url mono">{url}</span>
        <p className="link-card__help">{help}</p>
      </div>
      <button className="button button-secondary" type="button" onClick={onCopy}>
        <Copy size={15} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function ResultsTable({
  event,
  bestIdx,
  busySlot,
  onSelectSlot,
}: {
  event: OrganizerEvent;
  bestIdx: number;
  busySlot: number | null;
  onSelectSlot: (slotIndex: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th className="participant-col sans">Participant</th>
            {event.slots.map((slot, index) => {
              const formatted = formatSlot(slot);
              const isBest = index === bestIdx;
              const isConfirmed = index === event.confirmed_slot_index;
              return (
                <th
                  className={`slot-col ${isBest ? "slot-best" : ""} ${
                    isConfirmed ? "slot-confirmed" : ""
                  }`}
                  key={`${slot.date}-${slot.start}-${index}`}
                >
                  <div className="slot-header">
                    <div>
                      <div style={{ fontSize: 12.5 }}>{formatted.day}</div>
                      <div className="slot-time mono">{formatted.time}</div>
                    </div>
                    <button
                      className="select-slot sans"
                      data-selected={isConfirmed}
                      type="button"
                      disabled={busySlot !== null}
                      onClick={() => onSelectSlot(index)}
                    >
                      {busySlot === index ? "Selecting..." : isConfirmed ? "Selected" : "Select this slot"}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {event.responses.map((response) => (
            <tr key={response.id || response.email}>
              <td className="participant-col sans">
                {response.participant_name || "Anonymous"}
                <span className="participant-meta">{response.organization}</span>
              </td>
              {event.slots.map((_, index) => {
                const isBest = index === bestIdx;
                const isConfirmed = index === event.confirmed_slot_index;
                return (
                  <td
                    className={`mark-cell ${isBest ? "slot-best" : ""} ${
                      isConfirmed ? "slot-confirmed" : ""
                    }`}
                    key={`${response.email}-${index}`}
                  >
                    <Mark value={response.availability[index]} />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="participant-col sans" style={{ fontWeight: 700, fontSize: 12 }}>
              Answers
            </td>
            {event.slots.map((_, index) => {
              const isBest = index === bestIdx;
              const isConfirmed = index === event.confirmed_slot_index;
              return (
                <td
                  className={`mark-cell mono ${isBest ? "slot-best" : ""} ${
                    isConfirmed ? "slot-confirmed" : ""
                  }`}
                  key={`answer-count-${index}`}
                  style={{ fontWeight: 700 }}
                >
                  {getSlotAnswerCount(event.responses, index)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Mark({ value }: { value: AvailabilityStatus }) {
  if (value === "yes") return <Check size={14} color="var(--green)" />;
  if (value === "maybe") return <Circle size={9} color="var(--amber)" fill="var(--amber)" />;
  return <X size={14} color="var(--red)" />;
}
