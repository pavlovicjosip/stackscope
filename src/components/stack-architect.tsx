"use client";

import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import {
  categoryLabels,
  categoryOrder,
  defaultStack,
  technologiesByCategory,
  type ArchitectureAssignments,
  type StackSelection,
  type TechnologyCategory,
} from "@/content/architecture";
import { selectedGuides } from "@/content/technology-guides";
import {
  compareFailureModes,
  compareStackSelections,
  defaultProjectContext,
  generateArchitectureAdr,
  migrationStepsFor,
  recommendArchitecture,
  assessArchitecture,
  type ArchitectureVariantId,
  type ProjectContext,
} from "@/lib/architecture-comparison";
import { buildArchitectureExample, type DiagramLens } from "@/lib/architecture-examples";
import {
  analyzeStack,
  defaultArchitectureAssignments,
  officialSourcesForAnalysis,
  parseArchitectureAssignments,
  parseStackParams,
  toStackParams,
} from "@/lib/compatibility";

type Mode = "build" | "compare";
type InspectorTab = "flow" | "decisions" | "technologies" | "contracts" | "risks" | "sources";
type Variant = { id: string; name: string; description: string; selection: StackSelection; assignments: ArchitectureAssignments; preferred?: boolean };

const levelLabels = { compatible: "Compatible", conditional: "Conditional fit", incompatible: "Incompatible" } as const;
const inspectorTabs: InspectorTab[] = ["flow", "decisions", "technologies", "contracts", "risks", "sources"];

function architectureId(selection: StackSelection): ArchitectureVariantId {
  return selection.backendArchitecture === "microservices" || selection.backendArchitecture === "serverless"
    ? selection.backendArchitecture
    : "modular-monolith";
}

function sampleVariants(): Variant[] {
  const selections: StackSelection[] = [
    defaultStack,
    { ...defaultStack, frontend: "react", frontendArchitecture: "spa", backend: "spring", backendArchitecture: "microservices", compute: "ec2", deployment: "kubernetes" },
    { ...defaultStack, backendArchitecture: "serverless", packaging: "source", compute: "vercel-functions", deployment: "vercel", iac: "pulumi" },
  ];
  return [
    { id: "a", name: "Modular monolith", description: "Fast delivery with explicit module boundaries.", selection: selections[0], assignments: defaultArchitectureAssignments(selections[0]) },
    { id: "b", name: "Microservices", description: "Independent services and deployment ownership.", selection: selections[1], assignments: defaultArchitectureAssignments(selections[1]) },
    { id: "c", name: "Serverless", description: "Managed functions for event-shaped workloads.", selection: selections[2], assignments: defaultArchitectureAssignments(selections[2]) },
  ];
}

export function StackArchitect() {
  const [mode, setMode] = useState<Mode>("build");
  const [variants, setVariants] = useState<Variant[]>(sampleVariants);
  const [activeVariantId, setActiveVariantId] = useState("a");
  const [baselineId, setBaselineId] = useState("a");
  const [context, setContext] = useState<ProjectContext>(defaultProjectContext);
  const [contextOpen, setContextOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [lens, setLens] = useState<DiagramLens>("runtime");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("flow");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [technologyQuery, setTechnologyQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<TechnologyCategory>>(() => new Set(["frontend", "backendArchitecture"]));
  const [showDifferences, setShowDifferences] = useState(true);
  const [shareLabel, setShareLabel] = useState("Copy link");
  const [ready, setReady] = useState(false);

  const activeVariant = variants.find((variant) => variant.id === activeVariantId) ?? variants[0];
  const baseline = variants.find((variant) => variant.id === baselineId) ?? variants[0];
  const analysis = useMemo(() => analyzeStack(activeVariant.selection, activeVariant.assignments), [activeVariant]);
  const example = useMemo(() => buildArchitectureExample(analysis, lens), [analysis, lens]);
  const activeStep = example.steps[activeStepIndex] ?? example.steps[0];
  const recommendation = useMemo(() => recommendArchitecture(context), [context]);
  const currentAssessment = useMemo(() => assessArchitecture(architectureId(activeVariant.selection), context), [activeVariant.selection, context]);
  const differences = useMemo(() => compareStackSelections(baseline.selection, activeVariant.selection), [activeVariant.selection, baseline.selection]);
  const failures = useMemo(() => compareFailureModes(...variants.map((variant) => architectureId(variant.selection))), [variants]);
  const sources = officialSourcesForAnalysis(analysis);
  const playbooks = selectedGuides(analysis.selected);
  const blockerCount = analysis.findings.filter((item) => item.level === "blocker").length;
  const warningCount = analysis.findings.filter((item) => item.level === "warning").length;
  const visibleCategories = categoryOrder.filter((category) => {
    const query = technologyQuery.trim().toLowerCase();
    return !query || categoryLabels[category].toLowerCase().includes(query) || technologiesByCategory[category].some((technology) => technology.name.toLowerCase().includes(query));
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length) {
        const selection = parseStackParams(params);
        setVariants((current) => current.map((variant) => variant.id === "a" ? { ...variant, selection, assignments: parseArchitectureAssignments(params, selection) } : variant));
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${toStackParams(activeVariant.selection, activeVariant.assignments)}`);
  }, [activeVariant, ready]);

  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key === "Escape") { setCommandOpen(false); setContextOpen(false); setExportOpen(false); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
      if (isEditing) return;
      if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "d") setShowDifferences((current) => !current);
      if (!event.metaKey && !event.ctrlKey && ["1", "2", "3"].includes(event.key)) setActiveVariantId(variants[Number(event.key) - 1]?.id ?? activeVariantId);
    }
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [activeVariantId, variants]);

  function updateVariant(update: (variant: Variant) => Variant) {
    setVariants((current) => current.map((variant) => variant.id === activeVariant.id ? update(variant) : variant));
    setActiveStepIndex(0);
    setSelectedConnectionId(null);
  }

  function choose(category: TechnologyCategory, id: string) {
    updateVariant((variant) => {
      const assignments = { ...variant.assignments, frontendApps: { ...variant.assignments.frontendApps }, backendServices: { ...variant.assignments.backendServices } };
      if (category === "frontend") for (const key of Object.keys(assignments.frontendApps) as Array<keyof typeof assignments.frontendApps>) if (assignments.frontendApps[key] === variant.selection.frontend) assignments.frontendApps[key] = id;
      if (category === "backend") for (const key of Object.keys(assignments.backendServices) as Array<keyof typeof assignments.backendServices>) if (assignments.backendServices[key] === variant.selection.backend) assignments.backendServices[key] = id;
      return { ...variant, assignments, selection: { ...variant.selection, [category]: id } };
    });
  }

  function chooseAssignment(group: "frontendApps" | "backendServices", key: string, id: string) {
    updateVariant((variant) => ({ ...variant, assignments: { ...variant.assignments, [group]: { ...variant.assignments[group], [key]: id } } }));
  }

  function duplicateVariant() {
    if (variants.length >= 3) return;
    const id = crypto.randomUUID();
    setVariants((current) => [...current, { ...activeVariant, id, name: `Variant ${String.fromCharCode(65 + current.length)}`, preferred: false }]);
    setActiveVariantId(id);
  }

  function removeVariant() {
    if (variants.length === 1) return;
    const next = variants.filter((variant) => variant.id !== activeVariant.id);
    setVariants(next);
    setActiveVariantId(next[0].id);
    if (baselineId === activeVariant.id) setBaselineId(next[0].id);
  }

  function renameVariant() {
    const name = window.prompt("Variant name", activeVariant.name)?.trim();
    if (name) updateVariant((variant) => ({ ...variant, name }));
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Copy link"), 1500);
    } catch { setShareLabel("Use address bar"); }
  }

  const nodes = useMemo<Node[]>(() => example.nodes.map((item) => ({
    id: item.id,
    position: item.position,
    draggable: false,
    ariaLabel: `${item.eyebrow}: ${item.label}. ${item.technology}. ${item.summary}`,
    className: `architect-node example-node example-node--${item.kind}${activeStep.nodeIds.includes(item.id) ? " is-active" : " is-muted"}`,
    data: { label: <div data-testid={`example-node-${item.id}`}><span className="architect-node__symbol" aria-hidden="true">{item.kind === "data" ? "DB" : item.kind === "actor" ? "WB" : item.kind === "frontend" ? "UI" : item.kind === "delivery" ? "CI" : "AP"}</span><span className="architect-node__category">{item.eyebrow}</span><strong>{item.label}</strong><small>{item.technology}</small><p>{item.summary}</p></div> },
  })), [activeStep.nodeIds, example.nodes]);

  const edges = useMemo<Edge[]>(() => example.edges.map((item) => ({
    id: item.id, source: item.source, target: item.target, type: "smoothstep", label: item.label, selectable: true,
    animated: item.kind === "request" && activeStep.edgeIds.includes(item.id),
    className: `architect-edge architect-edge--${item.kind}${activeStep.edgeIds.includes(item.id) ? " is-selected" : " is-muted"}`,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    labelStyle: { fill: "#58677e", fontSize: 8, fontWeight: 800 }, labelBgStyle: { fill: "#ffffff", fillOpacity: .94 },
  })), [activeStep.edgeIds, example.edges]);

  return (
    <div className="architect-app lab-app">
      <div className="lab-mobile-summary"><strong>{activeVariant.name}</strong><span>{levelLabels[analysis.level]} · {warningCount} warnings</span><button type="button" onClick={() => document.querySelector(".technology-picker")?.scrollIntoView()}>Edit stack</button></div>
      <section className="architect-workbench lab-workbench" aria-label="Architect Lab">
        <TechnologyPalette query={technologyQuery} setQuery={setTechnologyQuery} visibleCategories={visibleCategories} openCategories={openCategories} setOpenCategories={setOpenCategories} selection={activeVariant.selection} analysis={analysis} choose={choose} blockers={blockerCount} reset={() => updateVariant((variant) => ({ ...variant, selection: defaultStack, assignments: defaultArchitectureAssignments(defaultStack) }))} />

        <main className="lab-center">
          <header className="lab-commandbar">
            <div><span className="lab-kicker">ARCHITECT LAB</span><strong>{activeVariant.name}</strong></div>
            <div className="lab-mode-switch" aria-label="Architect mode"><button type="button" aria-pressed={mode === "build"} onClick={() => setMode("build")}>Build</button><button type="button" aria-pressed={mode === "compare"} onClick={() => setMode("compare")}>Compare <span>{variants.length}</span></button></div>
            <div className="lab-global-actions"><button type="button" onClick={() => setContextOpen(true)}>Project context</button><button type="button" onClick={() => setCommandOpen(true)} aria-label="Open command palette">⌘ K</button><button type="button" onClick={share}>{shareLabel}</button></div>
          </header>

          {mode === "compare" && <VariantSwitcher variants={variants} activeId={activeVariant.id} baselineId={baseline.id} setActive={setActiveVariantId} duplicate={duplicateVariant} rename={renameVariant} remove={removeVariant} setBaseline={() => setBaselineId(activeVariant.id)} prefer={() => setVariants((current) => current.map((variant) => ({ ...variant, preferred: variant.id === activeVariant.id })))} />}

          <section className={`compatibility-summary compatibility-summary--${analysis.level}`} aria-label="Compatibility status">
            <div className="compatibility-summary__verdict" role="status"><i aria-hidden="true">{analysis.level === "compatible" ? "✓" : analysis.level === "conditional" ? "!" : "×"}</i><div><span>Configuration status</span><strong>{levelLabels[analysis.level]}</strong><p>{analysis.summary}</p></div></div>
            <dl><div><dd>{categoryOrder.length}</dd><dt>Selected</dt></div><div><dd className="is-blocking">{blockerCount}</dd><dt>Blocking</dt></div><div><dd className="is-warning">{warningCount}</dd><dt>Warnings</dt></div><div><dd>{analysis.findings.length}</dd><dt>Decisions</dt></div></dl>
            <button type="button" className="lab-review-button" onClick={() => setInspectorTab("decisions")}>Review issues</button>
          </section>

          <section className="architecture-title-card lab-architecture-title">
            <i aria-hidden="true">◇</i><div><span>{mode === "compare" ? `BASELINE: ${baseline.name}` : "CONCRETE RUNTIME TOPOLOGY"}</span><h1><span className="sr-only">Compose a stack: </span>{example.title}</h1><p>{example.subtitle}</p></div>
            <div className="lab-title-meta"><span>Context</span><strong>{context.engineers} engineers · {context.deliveryMonths} months · {context.cloudProvider}</strong></div>
          </section>

          {(activeVariant.selection.frontendArchitecture === "microfrontends" || activeVariant.selection.backendArchitecture === "microservices") && <CompositionEditor variant={activeVariant} chooseAssignment={chooseAssignment} />}

          {mode === "compare" && <DifferenceSummary baseline={baseline.name} active={activeVariant.name} differences={differences} visible={showDifferences} toggle={() => setShowDifferences((current) => !current)} />}

          <section className="topology-card lab-topology">
            <header><div><strong>{lens === "runtime" ? "Runtime topology" : "Delivery topology"}</strong><span>{example.nodes.length} nodes · {example.edges.length} dependencies</span></div><div className="map-lens-switch" aria-label="Diagram view"><button type="button" aria-pressed={lens === "runtime"} onClick={() => { setLens("runtime"); setActiveStepIndex(0); }}>Runtime</button><button type="button" aria-pressed={lens === "delivery"} onClick={() => { setLens("delivery"); setActiveStepIndex(0); }}>Delivery</button></div></header>
            <div className="architecture-map" data-testid="architecture-map">
              <ReactFlow key={`${activeVariant.id}-${lens}-${Object.values(activeVariant.selection).join("-")}`} nodes={nodes} edges={edges} nodesConnectable={false} fitView fitViewOptions={{ padding: .1 }} minZoom={.36} maxZoom={1.7} onNodeClick={(_, node) => { const index = example.steps.findIndex((step) => step.nodeIds.includes(node.id)); if (index >= 0) setActiveStepIndex(index); setInspectorTab("flow"); }} onEdgeClick={(_, edge) => { const index = example.steps.findIndex((step) => step.edgeIds.includes(edge.id)); if (index >= 0) setActiveStepIndex(index); setInspectorTab("contracts"); }} proOptions={{ hideAttribution: true }}>
                <Background color="#d7dce5" gap={28} size={1} /><Controls showInteractive={false} position="bottom-left" />
              </ReactFlow>
              {showDifferences && mode === "compare" && differences.length > 0 && <div className="difference-badge" role="status">Δ {differences.length} changed decisions</div>}
            </div>
            <div className="architecture-legend"><span><i className="legend-request" /> Request</span><span><i className="legend-data" /> Data</span><span><i className="legend-async" /> Async</span><span><i className="legend-artifact" /> Artifact</span><span><i className="legend-delivery" /> Control</span></div>
          </section>

          {mode === "build" ? <ArchitectureWalkthrough steps={example.steps} activeIndex={activeStepIndex} setActive={setActiveStepIndex} /> : <ComparisonScorecard variants={variants} active={activeVariant} context={context} recommendationId={recommendation.recommended.id} />}

          <section className="lab-decision-queue" aria-labelledby="decision-queue-title"><div><span>DECISION QUEUE</span><h2 id="decision-queue-title">What must be true</h2></div><div>{analysis.findings.map((finding) => <article className={`is-${finding.level}`} key={`${finding.title}-${finding.technologyIds.join("-")}`}><span aria-hidden="true">{finding.level === "blocker" ? "×" : finding.level === "warning" ? "!" : "✓"}</span><div><h3>{finding.title}</h3><p>{finding.detail}</p></div><button type="button" onClick={() => setInspectorTab("decisions")}>{finding.level === "note" ? "Review" : "Resolve"}</button></article>)}</div></section>
          <section className="lab-contract-shortcuts" aria-label="Communication contracts"><header><span>COMMUNICATION CONTRACTS</span><strong>Inspect a dependency</strong></header><div>{analysis.connections.map((connection) => <button type="button" key={connection.id} onClick={() => { setSelectedConnectionId(connection.id); setInspectorTab("contracts"); }}><small>{categoryLabels[connection.source]} → {categoryLabels[connection.target]}</small><strong>{connection.label}</strong></button>)}</div>{selectedConnectionId && <div className="connection-inspector is-visible"><strong>{analysis.connections.find((connection) => connection.id === selectedConnectionId)?.label}</strong><p>{analysis.connections.find((connection) => connection.id === selectedConnectionId)?.detail}</p></div>}</section>
          <div className="sr-only" aria-label="Official evidence">{sources.map((source) => <a href={source.url} key={source.url}>{source.label}</a>)}</div>
        </main>

        <InspectorPanel tab={inspectorTab} setTab={setInspectorTab} analysis={analysis} example={example} activeStep={activeStep} selectedConnectionId={selectedConnectionId} setSelectedConnectionId={setSelectedConnectionId} playbooks={playbooks} sources={sources} failures={failures.failureModes.filter((failure) => failure.variant === architectureId(activeVariant.selection))} recommendation={recommendation} currentAssessment={currentAssessment} activeVariant={activeVariant} openExport={() => setExportOpen(true)} />
      </section>

      {contextOpen && <ProjectContextDialog context={context} setContext={setContext} close={() => setContextOpen(false)} />}
      {exportOpen && <ExportDialog context={context} recommendation={recommendation} activeVariant={variants.find((variant) => variant.preferred) ?? activeVariant} baseline={baseline} close={() => setExportOpen(false)} />}
      {commandOpen && <CommandPalette close={() => setCommandOpen(false)} actions={[{ label: "Switch to Build mode", run: () => setMode("build") }, { label: "Switch to Compare mode", run: () => setMode("compare") }, { label: "Edit project context", run: () => setContextOpen(true) }, { label: "Export decision record", run: () => setExportOpen(true) }, { label: "Toggle differences", run: () => setShowDifferences((current) => !current) }]} />}
    </div>
  );
}

type PaletteProps = { query: string; setQuery: (value: string) => void; visibleCategories: TechnologyCategory[]; openCategories: Set<TechnologyCategory>; setOpenCategories: React.Dispatch<React.SetStateAction<Set<TechnologyCategory>>>; selection: StackSelection; analysis: ReturnType<typeof analyzeStack>; choose: (category: TechnologyCategory, id: string) => void; blockers: number; reset: () => void };
function TechnologyPalette({ query, setQuery, visibleCategories, openCategories, setOpenCategories, selection, analysis, choose, blockers, reset }: PaletteProps) {
  return <aside className="technology-picker" aria-label="Choose technologies"><div className="technology-picker__heading"><strong>Technology palette</strong><small>One choice per architecture layer</small></div><label className="technology-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search technologies..." aria-label="Search technologies" /></label><div className="technology-picker__groups">{visibleCategories.map((category) => <details key={category} open={Boolean(query.trim()) || openCategories.has(category)} onToggle={(event) => { if (query.trim()) return; const isOpen = event.currentTarget.open; setOpenCategories((current) => { const next = new Set(current); if (isOpen) { next.clear(); next.add(category); } else next.delete(category); return next; }); }}><summary><span className="technology-summary__icon" aria-hidden="true">{analysis.selected[category].mark}</span><strong>{categoryLabels[category]}</strong><b>{analysis.selected[category].name}</b><span className="technology-summary__check" aria-hidden="true">✓</span></summary><fieldset><legend className="sr-only">{categoryLabels[category]}</legend><div className="technology-options">{technologiesByCategory[category].filter((technology) => !query.trim() || technology.name.toLowerCase().includes(query.toLowerCase()) || categoryLabels[category].toLowerCase().includes(query.toLowerCase())).map((technology) => <label key={technology.id} className={selection[category] === technology.id ? "is-selected" : ""}><input type="radio" name={category} value={technology.id} checked={selection[category] === technology.id} onChange={() => choose(category, technology.id)} /><span className="technology-option__mark" aria-hidden="true">{technology.mark}</span><span><strong>{technology.name}</strong><small>{technology.runtime}</small></span>{selection[category] === technology.id && <span className="technology-option__check" aria-hidden="true">✓</span>}</label>)}</div></fieldset></details>)}</div><div className="technology-picker__actions"><div><strong>{categoryOrder.length} / {categoryOrder.length}</strong><span> selected · {blockers} blocking</span></div><i aria-hidden="true" /><button type="button" onClick={() => document.querySelector(".architecture-map")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Generate architecture</button><button className="technology-picker__reset" type="button" onClick={reset}>Reset</button></div></aside>;
}

function VariantSwitcher({ variants, activeId, baselineId, setActive, duplicate, rename, remove, setBaseline, prefer }: { variants: Variant[]; activeId: string; baselineId: string; setActive: (id: string) => void; duplicate: () => void; rename: () => void; remove: () => void; setBaseline: () => void; prefer: () => void }) {
  return <section className="variant-bar" aria-label="Architecture variants"><div role="tablist">{variants.map((variant, index) => <button type="button" role="tab" aria-selected={variant.id === activeId} onClick={() => setActive(variant.id)} key={variant.id}><span>0{index + 1}</span><strong>{variant.name}</strong>{variant.id === baselineId && <small>Baseline</small>}{variant.preferred && <small>Preferred</small>}</button>)}</div><div className="variant-actions"><button type="button" onClick={duplicate} disabled={variants.length >= 3}>Duplicate</button><button type="button" onClick={rename}>Rename</button><button type="button" onClick={setBaseline}>Set baseline</button><button type="button" onClick={prefer}>Mark preferred</button><button type="button" onClick={remove} disabled={variants.length === 1}>Delete</button></div></section>;
}

function CompositionEditor({ variant, chooseAssignment }: { variant: Variant; chooseAssignment: (group: "frontendApps" | "backendServices", key: string, id: string) => void }) {
  const frontendCount = new Set([variant.selection.frontend, ...Object.values(variant.assignments.frontendApps)]).size;
  const backendCount = new Set(Object.values(variant.assignments.backendServices)).size;
  return <section className="composition-editor" aria-label="Independent runtime assignments"><header><strong>Independent deployment boundaries</strong><span>Framework-neutral contracts keep variants honest.</span></header>{variant.selection.frontendArchitecture === "microfrontends" && <><div><strong>Frontend applications</strong>{(["catalog", "account", "checkout"] as const).map((key) => <label key={key}>{key}<select aria-label={`${key} microfrontend framework`} value={variant.assignments.frontendApps[key]} onChange={(event) => chooseAssignment("frontendApps", key, event.target.value)}>{technologiesByCategory.frontend.map((technology) => <option value={technology.id} key={technology.id}>{technology.name}</option>)}</select></label>)}</div><p>{frontendCount} framework{frontendCount === 1 ? "" : "s"} across 4 applications</p></>}{variant.selection.backendArchitecture === "microservices" && <><div><strong>Backend services</strong>{(["identity", "catalog", "orders"] as const).map((key) => <label key={key}>{key}<select aria-label={`${key} service framework`} value={variant.assignments.backendServices[key]} onChange={(event) => chooseAssignment("backendServices", key, event.target.value)}>{technologiesByCategory.backend.map((technology) => <option value={technology.id} key={technology.id}>{technology.name}</option>)}</select></label>)}</div><p>{backendCount} runtime{backendCount === 1 ? "" : "s"} across 3 services</p></>}</section>;
}

function DifferenceSummary({ baseline, active, differences, visible, toggle }: { baseline: string; active: string; differences: ReturnType<typeof compareStackSelections>; visible: boolean; toggle: () => void }) {
  return <section className="difference-summary"><header><div><span>ARCHITECTURE DELTA</span><h2>{baseline} <b>→</b> {active}</h2></div><button type="button" aria-pressed={visible} onClick={toggle}>{visible ? "Hide" : "Show"} differences <kbd>D</kbd></button></header>{differences.length ? visible && <div>{differences.map((difference) => <article key={difference.category}><span>{difference.label}</span><strong>{difference.before}</strong><b>→</b><strong>{difference.after}</strong></article>)}</div> : <p>This variant currently matches the baseline. Change a technology or pattern to compare consequences.</p>}</section>;
}

function ArchitectureWalkthrough({ steps, activeIndex, setActive }: { steps: ReturnType<typeof buildArchitectureExample>["steps"]; activeIndex: number; setActive: (index: number) => void }) {
  const step = steps[activeIndex] ?? steps[0];
  return <section className="architecture-walkthrough lab-walkthrough"><div className="walkthrough-index" role="tablist" aria-label="Architecture steps">{steps.map((item, index) => <button type="button" role="tab" aria-selected={index === activeIndex} key={item.id} onClick={() => setActive(index)}><span>{item.number}</span><small>{item.phase}</small><strong>{item.title}</strong></button>)}</div><article className="walkthrough-detail"><header><span>{step.number} / {step.phase}</span><h2>{step.title}</h2></header><div className="walkthrough-detail__grid"><section><span>WHAT HAPPENS</span><p>{step.whatHappens}</p></section><section><span>CONCRETE EXAMPLE</span><p>{step.concreteExample}</p></section><section className="walkthrough-risk"><span>WHAT BREAKS</span><p>{step.failureMode}</p></section><section className="walkthrough-decision"><span>ARCHITECT DECIDES</span><p>{step.decision}</p></section></div></article></section>;
}

function ComparisonScorecard({ variants, active, context, recommendationId }: { variants: Variant[]; active: Variant; context: ProjectContext; recommendationId: ArchitectureVariantId }) {
  const result = assessArchitecture(architectureId(active.selection), context);
  return <section className="comparison-scorecard"><header><div><span>CONSEQUENCE SCORECARD</span><h2>{active.name}</h2><p>Ratings explain consequences under the current project assumptions. They are not universal technology scores.</p></div>{architectureId(active.selection) === recommendationId && <b>Recommended for this context</b>}</header><div>{result.assessments.map((assessment) => <article key={assessment.dimension.id}><div><span>{assessment.dimension.label}</span><strong className={`rating-${assessment.rating.toLowerCase()}`}>{assessment.rating}</strong></div><p>{assessment.explanation}</p><footer><span>Assumes {assessment.assumptions[0].toLowerCase()}</span><b>{assessment.confidence} confidence</b></footer></article>)}</div><p className="scorecard-note">Comparing {variants.length} variants · Recommendation updates when project context changes.</p></section>;
}

type InspectorProps = { tab: InspectorTab; setTab: (tab: InspectorTab) => void; analysis: ReturnType<typeof analyzeStack>; example: ReturnType<typeof buildArchitectureExample>; activeStep: ReturnType<typeof buildArchitectureExample>["steps"][number]; selectedConnectionId: string | null; setSelectedConnectionId: (id: string) => void; playbooks: ReturnType<typeof selectedGuides>; sources: ReturnType<typeof officialSourcesForAnalysis>; failures: ReturnType<typeof compareFailureModes>["failureModes"]; recommendation: ReturnType<typeof recommendArchitecture>; currentAssessment: ReturnType<typeof assessArchitecture>; activeVariant: Variant; openExport: () => void };
function InspectorPanel({ tab, setTab, analysis, example, activeStep, selectedConnectionId, setSelectedConnectionId, playbooks, sources, failures, recommendation, currentAssessment, activeVariant, openExport }: InspectorProps) {
  const selectedConnection = analysis.connections.find((connection) => connection.id === selectedConnectionId);
  return <aside className="inspector-panel" aria-label="Architecture inspector"><nav role="tablist" aria-label="Inspector sections">{inspectorTabs.map((item) => <button type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}{item === "risks" && <span>{failures.length}</span>}</button>)}</nav><div className="inspector-content" tabIndex={0} aria-label={`${tab} inspector content`}>
    {tab === "flow" && <><div className="inspector-heading"><span>REQUEST FLOW</span><strong className="inspector-title">{activeStep.title}</strong><p>Select a node or connection to isolate its role in the request.</p></div><ol className="inspector-flow">{example.steps.map((step, index) => <li className={step.id === activeStep.id ? "is-active" : ""} key={step.id}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.whatHappens}</p></div></li>)}</ol><TradeoffCard title={analysis.selected.backendArchitecture.name} good={architectureId(activeVariant.selection) === "modular-monolith" ? "One team needs fast delivery and local transactions." : "Independent ownership or event-shaped scaling is valuable."} avoid={architectureId(activeVariant.selection) === "microservices" ? "Platform maturity and observability are low." : "Independent domain scaling is already a measured need."} introduces={currentAssessment.variant.consequences.join(" · ")} requires="Explicit boundaries, ownership, health signals, and an exit path." /></>}
    {tab === "decisions" && <><div className="inspector-heading"><span>DECISIONS</span><h2>{analysis.findings.length} assumptions to record</h2><p>Every warning must be resolved or accepted with a reason.</p></div><div className="inspector-cards">{analysis.findings.map((finding) => <article className={`is-${finding.level}`} key={finding.title}><span>{finding.level}</span><h3>{finding.title}</h3><p>{finding.detail}</p><button type="button">{finding.level === "note" ? "Record decision" : "Apply recommendation"}</button><button type="button" className="text-button">Ignore with justification</button></article>)}</div></>}
    {tab === "technologies" && <><div className="inspector-heading"><span>TECHNOLOGIES</span><h2>Responsibilities, not logos</h2><p>Each choice is explained through ownership and operational consequences.</p></div><div className="inspector-cards">{playbooks.map(({ technology, guide }) => <details key={technology.id}><summary><i>{technology.mark}</i><strong>{technology.name}</strong><span>{categoryLabels[technology.category]}</span></summary><p>{guide.meaning}</p><h4>Watch for</h4><ul>{guide.watchFor.map((item) => <li key={item}>{item}</li>)}</ul>{technology.docs.map((doc) => <a href={doc.url} target="_blank" rel="noreferrer" key={doc.url}>{doc.label} ↗</a>)}</details>)}</div></>}
    {tab === "contracts" && <><div className="inspector-heading"><span>CONTRACTS</span><h2>Dependencies and hand-offs</h2><p>These protocol boundaries should survive implementation changes.</p></div>{selectedConnection && <article className="selected-contract"><span>SELECTED CONNECTION</span><h3>{categoryLabels[selectedConnection.source]} → {categoryLabels[selectedConnection.target]}</h3><strong>{selectedConnection.label}</strong><p>{selectedConnection.detail}</p></article>}<div className="contract-list">{analysis.connections.map((connection) => <button type="button" className={selectedConnectionId === connection.id ? "is-selected" : ""} onClick={() => setSelectedConnectionId(connection.id)} key={connection.id}><small>{categoryLabels[connection.source]} → {categoryLabels[connection.target]}</small><strong>{connection.label}</strong><span>{connection.kind}</span><p>{connection.detail}</p></button>)}</div></>}
    {tab === "risks" && <><div className="inspector-heading"><span>FAILURE MODES</span><h2>How this architecture fails</h2><p>Select a scenario to reason about blast radius and recovery.</p></div><div className="failure-list">{failures.map((failure) => <article key={failure.id}><header><span>{failure.title}</span><b>{failure.impact} impact</b></header><dl><div><dt>Detection</dt><dd>{failure.detection}</dd></div><div><dt>Mitigation</dt><dd>{failure.mitigation}</dd></div></dl></article>)}</div><MigrationPath from="modular-monolith" to={architectureId(activeVariant.selection)} /></>}
    {tab === "sources" && <><div className="inspector-heading"><span>PRIMARY EVIDENCE</span><h2>Sources by decision</h2><p>Use official guidance to verify the assumptions behind this configuration.</p></div><div className="source-list">{sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span>{source.technology}</span><strong>{source.label}</strong><b>↗</b></a>)}</div></>}
  </div><footer className="inspector-recommendation"><span>{recommendation.confidence} confidence</span><strong>Recommended: {recommendation.recommended.name}</strong><p>{recommendation.reasons[0]}</p><button type="button" onClick={openExport}>Review decision & export ADR</button></footer></aside>;
}

function TradeoffCard({ title, good, avoid, introduces, requires }: { title: string; good: string; avoid: string; introduces: string; requires: string }) { return <article className="tradeoff-card"><h3>{title} trade-offs</h3><div><strong>Good when</strong><p>{good}</p></div><div><strong>Avoid when</strong><p>{avoid}</p></div><div><strong>Introduces</strong><p>{introduces}</p></div><div><strong>Requires</strong><p>{requires}</p></div><div><strong>Exit path</strong><p>Enforce contracts and data ownership before changing deployment boundaries.</p></div></article>; }

function MigrationPath({ from, to }: { from: ArchitectureVariantId; to: ArchitectureVariantId }) { const steps = migrationStepsFor(from, to); return <section className="migration-path"><span>MIGRATION PATH</span><h3>{from.replaceAll("-", " ")} → {to.replaceAll("-", " ")}</h3><ol>{steps.map((step) => <li key={step.order}><span>{step.order}</span><div><strong>{step.title}</strong><p>{step.outcome}</p><small>Exit: {step.exitCriteria}</small></div></li>)}</ol></section>; }

function ProjectContextDialog({ context, setContext, close }: { context: ProjectContext; setContext: React.Dispatch<React.SetStateAction<ProjectContext>>; close: () => void }) {
  const ratings = ["Low", "Medium", "High"] as const;
  return <div className="lab-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="context-dialog" role="dialog" aria-modal="true" aria-labelledby="context-title"><header><div><span>PROJECT CONTEXT</span><h2 id="context-title">Tune recommendations to reality</h2><p>Only the inputs that materially affect the recommendation are required.</p></div><button type="button" onClick={close} aria-label="Close project context">×</button></header><div className="context-grid"><label>Product type<input value={context.productType} onChange={(event) => setContext((current) => ({ ...current, productType: event.target.value }))} /></label><label>Engineers<input type="number" min="1" value={context.engineers} onChange={(event) => setContext((current) => ({ ...current, engineers: Number(event.target.value) }))} /></label><label>Engineering teams<input type="number" min="1" value={context.teams} onChange={(event) => setContext((current) => ({ ...current, teams: Number(event.target.value) }))} /></label><label>Delivery timeline (months)<input type="number" min="1" value={context.deliveryMonths} onChange={(event) => setContext((current) => ({ ...current, deliveryMonths: Number(event.target.value) }))} /></label><label>Expected traffic<select value={context.traffic} onChange={(event) => setContext((current) => ({ ...current, traffic: event.target.value as ProjectContext["traffic"] }))}>{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select></label><label>Traffic variability<select value={context.trafficVariability} onChange={(event) => setContext((current) => ({ ...current, trafficVariability: event.target.value as ProjectContext["trafficVariability"] }))}>{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select></label><label>Platform maturity<select value={context.platformMaturity} onChange={(event) => setContext((current) => ({ ...current, platformMaturity: event.target.value as ProjectContext["platformMaturity"] }))}>{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select></label><label>Budget sensitivity<select value={context.costSensitivity} onChange={(event) => setContext((current) => ({ ...current, costSensitivity: event.target.value as ProjectContext["costSensitivity"] }))}>{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select></label><label>Cloud preference<select value={context.cloudProvider} onChange={(event) => setContext((current) => ({ ...current, cloudProvider: event.target.value as ProjectContext["cloudProvider"] }))}>{["AWS", "Azure", "GCP", "Other"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Compliance<select value={context.compliance} onChange={(event) => setContext((current) => ({ ...current, compliance: event.target.value as ProjectContext["compliance"] }))}>{["Standard", "Regulated", "Strict"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Data consistency<select value={context.dataConsistency} onChange={(event) => setContext((current) => ({ ...current, dataConsistency: event.target.value as ProjectContext["dataConsistency"] }))}>{["Eventual", "Mixed", "Strong"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Availability target<input value={context.availabilityTarget} onChange={(event) => setContext((current) => ({ ...current, availabilityTarget: event.target.value }))} /></label><label>Expected lifetime<input value={context.systemLifetime} onChange={(event) => setContext((current) => ({ ...current, systemLifetime: event.target.value }))} /></label><label>Vendor lock-in tolerance<select value={context.lockInTolerance} onChange={(event) => setContext((current) => ({ ...current, lockInTolerance: event.target.value as ProjectContext["lockInTolerance"] }))}>{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select></label></div><footer><p>Current recommendation: <strong>{recommendArchitecture(context).recommended.name}</strong></p><button type="button" onClick={() => setContext(defaultProjectContext)}>Restore defaults</button><button type="button" onClick={close}>Apply context</button></footer></section></div>;
}

function ExportDialog({ context, recommendation, activeVariant, baseline, close }: { context: ProjectContext; recommendation: ReturnType<typeof recommendArchitecture>; activeVariant: Variant; baseline: Variant; close: () => void }) {
  const differences = compareStackSelections(baseline.selection, activeVariant.selection);
  const selectedResult = assessArchitecture(architectureId(activeVariant.selection), context);
  const decision = selectedResult.variant.id === recommendation.recommended.id ? recommendation : {
    recommended: selectedResult.variant,
    result: selectedResult,
    alternatives: [recommendation.result, ...recommendation.alternatives].filter((result) => result.variant.id !== selectedResult.variant.id),
    reasons: selectedResult.assessments.filter((assessment) => assessment.rating === "High").slice(0, 3).map((assessment) => `${assessment.dimension.label}: ${assessment.explanation}`),
    whatCouldChange: ["Measured costs or reliability do not meet the assumptions in this record.", "Team topology or platform maturity changes materially."],
    confidence: "Medium" as const,
  };
  const markdown = generateArchitectureAdr({ title: `Use ${decision.recommended.name} for ${context.productType}`, status: "Accepted", context, recommendation: decision, stackDifferences: differences, migration: migrationStepsFor("modular-monolith", architectureId(activeVariant.selection)) });
  function download(name: string, content: string, type: string) { const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(new Blob([content], { type })); anchor.download = name; anchor.click(); URL.revokeObjectURL(anchor.href); }
  return <div className="lab-overlay"><section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title"><header><div><span>ARCHITECTURE DECISION RECORD</span><h2 id="export-title">Review the decision before export</h2></div><button type="button" onClick={close} aria-label="Close export dialog">×</button></header><pre>{markdown}</pre><footer><button type="button" onClick={() => navigator.clipboard.writeText(markdown)}>Copy Markdown</button><button type="button" onClick={() => download("architecture-decision.md", markdown, "text/markdown")}>Markdown</button><button type="button" onClick={() => download("architecture-decision.json", JSON.stringify({ context, recommendation: decision, variant: activeVariant }, null, 2), "application/json")}>JSON</button><button type="button" onClick={() => window.print()}>PDF / Print</button><button type="button" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy configuration URL</button></footer></section></div>;
}

function CommandPalette({ actions, close }: { actions: Array<{ label: string; run: () => void }>; close: () => void }) { return <div className="lab-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette"><header><span>⌘</span><input autoFocus placeholder="Type a command..." aria-label="Search commands" /><kbd>Esc</kbd></header><div>{actions.map((action) => <button type="button" key={action.label} onClick={() => { action.run(); close(); }}>{action.label}<span>↵</span></button>)}</div><footer>Shortcuts: D differences · 1–3 variants · Ctrl/Cmd K commands</footer></section></div>; }
