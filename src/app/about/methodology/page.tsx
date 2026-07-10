import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How StackScope explains systems", description: "Our approach to progressive depth, honest simplification, accessibility, and technical review." };

export default function MethodologyPage() {
  return (
    <main id="main-content" className="method-page shell">
      <div className="page-hero"><span className="section-index">OUR METHOD</span><h1>Clarity without<br /><em>pretending it is simple.</em></h1><p>Every StackScope flow is a deliberately bounded mental model—not a claim that every real system works exactly the same way.</p></div>
      <div className="method-grid">
        <article><span>01</span><h2>Start with a user action</h2><p>Scenarios provide a reason for every technology in the diagram. Vocabulary arrives only when the learner has a place to attach it.</p></article>
        <article><span>02</span><h2>Reveal causal steps</h2><p>Each playback step changes one meaningful part of the system so animation explains cause and effect instead of decorating it.</p></article>
        <article><span>03</span><h2>Offer progressive depth</h2><p>Plain language establishes the model; engineering explains mechanics; production exposes failure, security, and operational trade-offs.</p></article>
        <article><span>04</span><h2>Label simplifications</h2><p>Every lesson names important omitted concerns and alternatives. A useful map must reveal its boundary.</p></article>
        <article><span>05</span><h2>Design accessibly</h2><p>Static structure, narration, keyboard controls, redundant visual cues, and reduced-motion behavior are part of the core product.</p></article>
        <article><span>06</span><h2>Review and revisit</h2><p>Content carries a review date and is checked for technical accuracy, clear language, and safe production guidance.</p></article>
      </div>
      <div className="method-cta"><div><span className="section-index">READY?</span><h2>Follow your first request.</h2></div><Link className="button button--primary" href="/learn/signing-in/">Open the sign-in flow →</Link></div>
    </main>
  );
}
