import type { Slot } from "./types";

function toFilenameSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function eventDownloadName(title: string, slot?: Slot) {
  const titleSegment = toFilenameSegment(title).slice(0, 64).replace(/-+$/g, "") || "polipol";

  if (!slot) {
    return titleSegment;
  }

  const timeSegment = `${slot.start.replace(":", "-")}-${slot.end.replace(":", "-")}`;
  return `${titleSegment}-${slot.date}-${timeSegment}`;
}
