import { notFound } from "next/navigation";
import { loadOrganizerEvent } from "../../../../lib/organizer";
import { isUuid } from "../../../../lib/validation";
import OrganizerView from "./organizer-view";

export const dynamic = "force-dynamic";

export default async function OrganizerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; organizer_token: string }>;
  searchParams: Promise<{ recovery?: string }>;
}) {
  const { id, organizer_token: organizerToken } = await params;
  const { recovery } = await searchParams;

  if (!isUuid(id) || !isUuid(organizerToken)) {
    notFound();
  }

  const event = await loadOrganizerEvent(id, organizerToken);

  if (!event) {
    notFound();
  }

  return <OrganizerView event={event} token={organizerToken} recoveryEnabled={recovery === "1"} />;
}
