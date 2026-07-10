"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { DetailDepth, Lesson } from "@/content/types";
import { parsePlaybackParams, playbackReducer, initialPlaybackState, toPlaybackParams } from "@/lib/playback";
import { KnowledgeCheckCard } from "./knowledge-check";
import { SystemMap } from "./system-map";

const depths: Array<{ id: DetailDepth; label: string }> = [
  { id: "plain", label: "Plain language" },
  { id: "engineering", label: "Engineering" },
  { id: "production", label: "Production" },
];

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share this state");
  const [variantId, setVariantId] = useState(lesson.variants?.[0]?.id ?? null);
  const inspectorHeadingRef = useRef<HTMLHeadingElement>(null);
  const variant = lesson.variants?.find((item) => item.id === variantId);
  const steps = variant?.steps ?? lesson.steps;
  const step = steps[state.stepIndex];
  const visibleNodeIds = useMemo(() => variant ? new Set(variant.nodeIds) : undefined, [variant]);
  const visibleEdgeIds = useMemo(() => variant ? new Set(variant.edgeIds) : undefined, [variant]);
  const selectableIds = useMemo(() => new Set([...lesson.nodes.map((item) => item.id), ...lesson.edges.map((item) => item.id)]), [lesson.edges, lesson.nodes]);
  const activeNodes = lesson.nodes.filter((item) => step.activeNodeIds.includes(item.id) && (!visibleNodeIds || visibleNodeIds.has(item.id)));
  const activeEdges = lesson.edges.filter((item) => step.activeEdgeIds.includes(item.id) && (!visibleEdgeIds || visibleEdgeIds.has(item.id)));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(media.matches);
    media.addEventListener("change", updateMotion);
    const frame = window.requestAnimationFrame(() => {
      updateMotion();
      dispatch({ type: "RESTORE", state: parsePlaybackParams(new URLSearchParams(window.location.search), lesson.steps.length, selectableIds), total: lesson.steps.length });
      setReady(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", updateMotion);
    };
  }, [lesson.steps.length, selectableIds]);

  useEffect(() => {
    if (!ready) return;
    const query = toPlaybackParams(state).toString();
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [ready, state]);

  useEffect(() => {
    if (state.status !== "playing" || reduceMotion) return;
    const timer = window.setTimeout(() => dispatch({ type: "NEXT", total: steps.length }), 3300);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, state.status, state.stepIndex, steps.length]);

  useEffect(() => {
    if (!state.selectedId) return;
    const frame = window.requestAnimationFrame(() => inspectorHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [state.selectedId]);

  const selected = useMemo(() => {
    const selectedNode = lesson.nodes.find((node) => node.id === state.selectedId);
    if (selectedNode) return { type: "node" as const, node: selectedNode };
    const selectedEdge = lesson.edges.find((edge) => edge.id === state.selectedId);
    if (selectedEdge) return { type: "edge" as const, edge: selectedEdge };
    return null;
  }, [lesson.edges, lesson.nodes, state.selectedId]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Link copied");
      window.setTimeout(() => setShareLabel("Share this state"), 1800);
    } catch {
      setShareLabel("Copy the URL above");
    }
  }

  const depthCopy = selected?.type === "node"
    ? state.depth === "plain" ? selected.node.summary : selected.node[state.depth]
    : null;
  const returnHref = `/learn/${lesson.slug}/?${toPlaybackParams(state).toString()}`;

  return (
    <>
      <div className="lesson-topbar shell">
        <Link href="/learn/" className="back-link">← All systems</Link>
        <div className="lesson-progress-label"><span>{lesson.eyebrow}</span><strong>{state.stepIndex + 1} / {steps.length}</strong></div>
        <button className="share-button" type="button" onClick={share}>{shareLabel} <span aria-hidden="true">↗</span></button>
      </div>

      <section className="player-shell" aria-label={`${lesson.title} interactive system`}>
        <div className="player-canvas">
          <div className="player-canvas__heading">
            <div><span className="live-dot">GUIDED SYSTEM</span><h1>{lesson.title}</h1></div>
            <div className="map-heading-tools">
              {lesson.variants && <div className="variant-switch" aria-label="Compare architecture variant">{lesson.variants.map((item) => <button type="button" key={item.id} aria-pressed={variantId === item.id} onClick={() => { setVariantId(item.id); dispatch({ type: "RESET" }); }}>{item.label}</button>)}</div>}
              <div className="legend" aria-label="System legend">
                <span><i className="legend__client" /> Client</span><span><i className="legend__service" /> Service</span><span><i className="legend__data" /> Data</span><span><i className="legend__infra" /> Infrastructure</span>
              </div>
            </div>
          </div>
          <SystemMap lesson={lesson} step={step} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: "SELECT", id })} reduceMotion={reduceMotion} visibleNodeIds={visibleNodeIds} visibleEdgeIds={visibleEdgeIds} />
          {variant && <p className="variant-description" role="status"><strong>{variant.label}:</strong> {variant.description}</p>}
          <ol className="semantic-flow sr-only">{steps.map((item, index) => <li key={item.id} aria-current={index === state.stepIndex ? "step" : undefined}>{item.title}: {item.narration}</li>)}</ol>
          <p className="sr-only" aria-live="polite">Step {state.stepIndex + 1}: {step.title}. Active components: {activeNodes.map((item) => item.label).join(", ") || "none"}. Active connections: {activeEdges.map((item) => item.label).join(", ") || "none"}.</p>
        </div>

        <aside className="player-panel" aria-label="Lesson explanation">
          {selected ? (
            <div className="inspector">
              <button className="inspector__close" type="button" onClick={() => dispatch({ type: "SELECT", id: null })} aria-label="Close component details">×</button>
              <span className="section-index">INSPECTING {selected.type.toUpperCase()}</span>
              {selected.type === "node" ? (
                <>
                  <h2 ref={inspectorHeadingRef} tabIndex={-1}>{selected.node.label}</h2><span className={`kind-pill kind-pill--${selected.node.kind}`}>{selected.node.kind}</span>
                  <div className="depth-tabs" role="group" aria-label="Explanation depth">
                    {depths.map((depth) => <button key={depth.id} type="button" aria-pressed={state.depth === depth.id} onClick={() => dispatch({ type: "SET_DEPTH", depth: depth.id })}>{depth.label}</button>)}
                  </div>
                  <p className="inspector__copy">{depthCopy}</p>
                  {selected.node.alternatives && <div className="alternatives"><strong>Common alternatives</strong><p>{selected.node.alternatives.join(" · ")}</p></div>}
                  {selected.node.concept && <Link className="text-link" href={`/concepts/${selected.node.concept}/?from=${encodeURIComponent(returnHref)}`}>Open concept guide →</Link>}
                </>
              ) : (
                <>
                  <h2 ref={inspectorHeadingRef} tabIndex={-1}>{selected.edge.label}</h2><span className="kind-pill">{selected.edge.kind} flow</span>
                  <p className="inspector__copy">This connection carries a <strong>{selected.edge.kind}</strong> from <strong>{lesson.nodes.find((node) => node.id === selected.edge.source)?.label}</strong> to <strong>{lesson.nodes.find((node) => node.id === selected.edge.target)?.label}</strong>.</p>
                  <p className="inspector__hint">Select either endpoint to inspect its responsibility and production trade-offs.</p>
                </>
              )}
            </div>
          ) : (
            <div className="step-panel" aria-live="polite">
              <div className="step-panel__number">{String(state.stepIndex + 1).padStart(2, "0")}</div><span className="section-index">CURRENT STEP</span><h2>{step.title}</h2>
              <p className="step-panel__narration">{step.narration}</p>
              <dl className="step-facts"><div><dt>PAYLOAD</dt><dd>{step.payload.label}</dd></div><div><dt>WHAT CAN FAIL</dt><dd>{step.failure}</dd></div><div><dt>WATCH</dt><dd>{step.observation}</dd></div></dl>
              <div className="entity-shortcuts" aria-label="Inspect active system elements">
                <strong>Inspect this step</strong>
                <div>
                  {activeNodes.map((item) => <button type="button" key={item.id} onClick={() => dispatch({ type: "SELECT", id: item.id })}>Inspect {item.label}</button>)}
                  {activeEdges.map((item) => <button type="button" key={item.id} onClick={() => dispatch({ type: "SELECT", id: item.id })}>Inspect {item.label} connection</button>)}
                </div>
              </div>
              <p className="inspector__hint">Select any node or connection to inspect it.</p>
            </div>
          )}

          <div className="player-controls">
            <button type="button" onClick={() => dispatch({ type: "PREVIOUS" })} disabled={state.stepIndex === 0} aria-label="Previous step">←</button>
            <button className="player-controls__play" type="button" onClick={() => dispatch({ type: state.status === "playing" ? "PAUSE" : "PLAY" })} disabled={state.status === "complete" || reduceMotion}>{reduceMotion ? "Manual" : state.status === "playing" ? "Pause" : state.status === "complete" ? "Complete" : "Play"}</button>
            <button type="button" onClick={() => dispatch({ type: "NEXT", total: steps.length })} disabled={state.stepIndex === steps.length - 1} aria-label="Next step">→</button>
            <button className="player-controls__reset" type="button" onClick={() => dispatch({ type: "RESET" })}>Restart</button>
          </div>
          <div className="step-dots" aria-label="Lesson steps">
            {steps.map((item, index) => <button key={item.id} type="button" aria-label={`Go to step ${index + 1}: ${item.title}`} aria-current={index === state.stepIndex ? "step" : undefined} onClick={() => dispatch({ type: "RESTORE", total: steps.length, state: { stepIndex: index, depth: state.depth } })}><span /></button>)}
          </div>
        </aside>
      </section>

      <section className="lesson-after shell">
        <div className="learning-objectives"><span className="section-index">AFTER THIS FLOW</span><h2>What you can now explain</h2><ul>{lesson.learningObjectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul><div className="simplification"><strong>What this model leaves out</strong><p>{lesson.simplification}</p></div><div className="content-meta"><span>Reviewed {lesson.reviewedAt} · {lesson.owner}</span>{lesson.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div></div>
        <KnowledgeCheckCard checks={lesson.checks} objectives={lesson.learningObjectives} />
      </section>
    </>
  );
}
