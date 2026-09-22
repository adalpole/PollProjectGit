import type { Metadata } from "next";
import { NotFoundContent } from "./not-found-content";

export const metadata: Metadata = {
  title: "Poll not available",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundContent />;
}
