import type { Slot } from "./types";

export function formatSlot(slot: Slot) {
  const date = new Date(`${slot.date}T00:00:00`);
  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return {
    day,
    time: `${slot.start}-${slot.end}`,
  };
}

export function getBestSlotIndex(responses: Array<{ availability: string[] }>, slotCount: number) {
  if (slotCount === 0) return -1;

  let bestIdx = -1;
  let bestScore = -1;

  for (let i = 0; i < slotCount; i += 1) {
    const score = responses.reduce((acc, response) => {
      const value = response.availability[i];
      return acc + (value === "yes" || value === "maybe" ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

export function getSlotAnswerCount(responses: Array<{ availability: string[] }>, slotIndex: number) {
  return responses.reduce((acc, response) => {
    const value = response.availability[slotIndex];
    return acc + (value === "yes" || value === "maybe" ? 1 : 0);
  }, 0);
}
