import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
import { lessonSummaries } from "@/content/lessons";

export const metadata: Metadata = { title: "Explore interactive lessons", description: "Browse visual explanations of frontend, backend, deployment, data, and architecture." };

export default function LearnPage() {
  return (
    <main id="main-content" className="page-shell shell">
      <div className="page-hero"><span className="section-index">THE SYSTEM LIBRARY</span><h1>Choose a flow.<br /><em>See every layer.</em></h1><p>Start with a real action, follow the moving parts, then inspect any component at your own depth.</p></div>
      <Catalog lessons={lessonSummaries} />
    </main>
  );
}
