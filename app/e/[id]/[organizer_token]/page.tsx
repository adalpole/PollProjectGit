import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { loadOrganizerEvent } from "../../../../lib/organizer";
import { isUuid } from "../../../../lib/validation";
import OrganizerView from "./organizer-view";

export const dynamic = "force-dynamic";

const getOrganizerEvent = cache(loadOrganizerEvent);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; organizer_token: string }>;
}): Promise<Metadata> {
  const { id, organizer_token: organizerToken } = await params;
  const event = isUuid(id) && isUuid(organizerToken)
    ? await getOrganizerEvent(id, organizerToken).catch(() => null)
    : null;
  const available = Boolean(event);
  const title = available ? "Organizer view" : "Poll not available";
  const description = available
    ? "Private organizer view for a PoliPol scheduling poll."
    : "This PoliPol scheduling poll is not available.";

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    openGraph: {
      title: `${title} | PoliPol`,
      description,
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "PoliPol scheduling poll preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PoliPol`,
      description,
      images: ["/og.png"],
    },
  };
}

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

  const event = await getOrganizerEvent(id, organizerToken);

  if (!event) {
    notFound();
  }

  return <OrganizerView event={event} token={organizerToken} recoveryEnabled={recovery === "1"} />;
}
