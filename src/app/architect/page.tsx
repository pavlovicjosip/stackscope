import type { Metadata } from "next";
import { StackArchitect } from "@/components/stack-architect";

export const metadata: Metadata = {
  title: "Technology stack compatibility architect",
  description: "Compose technologies, frontend and backend architecture patterns, infrastructure as code, compute, and deployment, then inspect compatibility using official documentation.",
};

export default function ArchitectPage() {
  return <main id="main-content"><StackArchitect /></main>;
}
