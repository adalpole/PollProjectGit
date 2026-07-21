import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadOrganizerEvent } from "../../../../lib/organizer";
import { isUuid } from "../../../../lib/validation";
import OrganizerView from "./organizer-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organizer view",
  description: "Private organizer view for a PoliPol scheduling poll.",
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
    title: "Organizer view | PoliPol",
    description: "Private organizer view for a PoliPol scheduling poll.",
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
    title: "Organizer view | PoliPol",
    description: "Private organizer view for a PoliPol scheduling poll.",
    images: ["/og.png"],
  },
};

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
