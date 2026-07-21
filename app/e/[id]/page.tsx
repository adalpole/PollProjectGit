import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { loadPublicEvent } from "../../../lib/public-event";
import { isUuid } from "../../../lib/validation";
import ParticipantForm from "./participant-form";

export const dynamic = "force-dynamic";

const getPublicEvent = cache(loadPublicEvent);
const pollDescription = "Add your availability for this PoliPol scheduling poll.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!isUuid(id)) {
    return {
      title: "Poll not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const event = await getPublicEvent(id).catch(() => null);

  if (!event) {
    return {
      title: "Poll not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = event.title;
  const canonicalPath = `/e/${event.id}`;

  return {
    title,
    description: pollDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | PoliPol`,
      description: pollDescription,
      url: canonicalPath,
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "PoliPol scheduling poll preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PoliPol`,
      description: pollDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const data = await getPublicEvent(id);

  if (!data) {
    notFound();
  }

  return <ParticipantForm event={data} />;
}
