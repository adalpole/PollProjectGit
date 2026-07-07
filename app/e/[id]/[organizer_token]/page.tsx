import { notFound } from "next/navigation";
import { loadOrganizerEvent } from "../../../../lib/organizer";
import { isUuid } from "../../../../lib/validation";
import OrganizerView from "./organizer-view";

export const dynamic = "force-dynamic";

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ id: string; organizer_token: string }>;
}) {
  const { id, organizer_token: organizerToken } = await params;

  if (!isUuid(id) || !isUuid(organizerToken)) {
    notFound();
  }

  const event = await loadOrganizerEvent(id, organizerToken);

  if (!event) {
    notFound();
  }

  return <OrganizerView event={event} token={organizerToken} />;
}
