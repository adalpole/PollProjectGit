import type { Metadata } from "next";
import { CookiesContent } from "./cookies-content";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Cookie and tracking information for PoliPol.",
};

export default function CookiesPage() {
  return <CookiesContent />;
}
