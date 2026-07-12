import type { Metadata } from "next";
import { StackArchitect } from "@/components/stack-architect";

export const metadata: Metadata = {
  title: "Architect Lab — compare architecture consequences",
  description: "Configure runtime architectures, compare variants, understand risks and trade-offs, and export the final decision as an architecture decision record.",
};

export default function ArchitectPage() {
  return <main id="main-content"><StackArchitect /></main>;
}
