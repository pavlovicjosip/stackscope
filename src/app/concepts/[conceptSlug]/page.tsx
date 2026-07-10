import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContextBackLink } from "@/components/context-back-link";
import { notFound } from "next/navigation";
import { concepts } from "@/content/concepts";
import { lessons } from "@/content/lessons";
import { getConcept } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return concepts.map((concept) => ({ conceptSlug: concept.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ conceptSlug: string }> }): Promise<Metadata> {
  const concept = getConcept((await params).conceptSlug);
  return concept ? { title: concept.name, description: concept.plain } : {};
}
export default async function ConceptPage({ params }: { params: Promise<{ conceptSlug: string }> }) {
  const concept = getConcept((await params).conceptSlug);
  if (!concept) notFound();
  const related = lessons.filter((lesson) => lesson.glossaryRefs.includes(concept.slug));
  return (
    <main id="main-content" className="concept-page shell">
      <Suspense fallback={<Link className="back-link" href="/learn/">← Explore systems</Link>}><ContextBackLink /></Suspense>
      <div className="concept-hero"><span className={`kind-pill kind-pill--${concept.category}`}>{concept.category}</span><h1>{concept.name}</h1><p>{concept.plain}</p></div>
      <div className="concept-depths"><article><span>01</span><h2>Plain language</h2><p>{concept.plain}</p></article><article><span>02</span><h2>Engineering view</h2><p>{concept.engineering}</p></article><article><span>03</span><h2>In production</h2><p>{concept.production}</p></article></div>
      <section className="related-lessons"><span className="section-index">SEE IT IN CONTEXT</span><h2>Related guided systems</h2><div>{related.map((lesson) => <Link href={`/learn/${lesson.slug}/`} key={lesson.slug}><span>{lesson.eyebrow}</span><strong>{lesson.title}</strong><i>→</i></Link>)}</div></section>
    </main>
  );
}
