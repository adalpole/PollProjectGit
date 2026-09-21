import type { Metadata } from "next";
import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy information for PoliPol scheduling polls.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
