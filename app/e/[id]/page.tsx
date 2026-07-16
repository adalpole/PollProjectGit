import { notFound } from "next/navigation";
import { loadPublicEvent } from "../../../lib/public-event";
import { isUuid } from "../../../lib/validation";
import ParticipantForm from "./participant-form";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const data = await loadPublicEvent(id);

  if (!data) {
    notFound();
  }

  return <ParticipantForm event={data} />;
}
