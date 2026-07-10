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
import { buildArchitectureExample, type DiagramLens } from "@/lib/architecture-examples";
import { analyzeStack, defaultArchitectureAssignments, officialSourcesForAnalysis, parseArchitectureAssignments, parseStackParams, toStackParams } from "@/lib/compatibility";

const levelLabels = { compatible: "Compatible", conditional: "Conditional fit", incompatible: "Incompatible" } as const;

export function StackArchitect() {
  const [selection, setSelection] = useState<StackSelection>(defaultStack);
  const [assignments, setAssignments] = useState<ArchitectureAssignments>(() => defaultArchitectureAssignments(defaultStack));
  const [ready, setReady] = useState(false);
  const [lens, setLens] = useState<DiagramLens>("runtime");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState("Share configuration");
  const analysis = useMemo(() => analyzeStack(selection, assignments), [assignments, selection]);
  const example = useMemo(() => buildArchitectureExample(analysis, lens), [analysis, lens]);
  const playbooks = useMemo(() => selectedGuides(analysis.selected), [analysis.selected]);
  const activeStep = example.steps[activeStepIndex] ?? example.steps[0];
  const selectedConnection = analysis.connections.find((connection) => connection.id === selectedConnectionId);
  const sources = officialSourcesForAnalysis(analysis);
  const frontendFrameworkCount = new Set([selection.frontend, ...Object.values(assignments.frontendApps)]).size;
  const backendFrameworkCount = new Set(Object.values(assignments.backendServices)).size;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const parsedSelection = parseStackParams(params);
      setSelection(parsedSelection);
      setAssignments(parseArchitectureAssignments(params, parsedSelection));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${toStackParams(selection, assignments).toString()}`);
  }, [assignments, ready, selection]);

  const nodes = useMemo<Node[]>(() => example.nodes.map((item) => {
    const isActive = activeStep.nodeIds.includes(item.id);
    return {
      id: item.id,
      position: item.position,
      draggable: false,
      selectable: true,
      ariaLabel: `${item.eyebrow}: ${item.label}. ${item.technology}. ${item.summary}`,
      className: `architect-node example-node example-node--${item.kind}${isActive ? " is-active" : " is-muted"}`,
      data: {
        label: <div data-testid={`example-node-${item.id}`}><span className="architect-node__category">{item.eyebrow}</span><strong>{item.label}</strong><small>{item.technology}</small><p>{item.summary}</p></div>,
      },
    };
  }), [activeStep.nodeIds, example.nodes]);

  const edges = useMemo<Edge[]>(() => example.edges.map((item) => ({
    id: item.id,
    source: item.source,
    target: item.target,
    type: "smoothstep",
    selectable: true,
    animated: item.kind === "request" && activeStep.edgeIds.includes(item.id),
    label: item.label,
    className: `architect-edge architect-edge--${item.kind}${activeStep.edgeIds.includes(item.id) ? " is-selected" : " is-muted"}`,
    markerEnd: { type: MarkerType.ArrowClosed, width: 17, height: 17 },
    labelStyle: { fill: "#c7d0da", fontSize: 8, fontWeight: 800 },
    labelBgStyle: { fill: "#0b1118", fillOpacity: 0.96 },
  })), [activeStep.edgeIds, example.edges]);

  function choose(category: TechnologyCategory, id: string) {
    if (category === "frontend") {
      setAssignments((current) => ({ ...current, frontendApps: Object.fromEntries(Object.entries(current.frontendApps).map(([key, value]) => [key, value === selection.frontend ? id : value])) as ArchitectureAssignments["frontendApps"] }));
    }
    if (category === "backend") {
      setAssignments((current) => ({ ...current, backendServices: Object.fromEntries(Object.entries(current.backendServices).map(([key, value]) => [key, value === selection.backend ? id : value])) as ArchitectureAssignments["backendServices"] }));
    }
    setSelection((current) => ({ ...current, [category]: id }));
    setActiveStepIndex(0);
    setSelectedConnectionId(null);
  }

  function chooseFrontendApp(key: keyof ArchitectureAssignments["frontendApps"], id: string) {
    setAssignments((current) => ({ ...current, frontendApps: { ...current.frontendApps, [key]: id } }));
    setActiveStepIndex(0);
    setSelectedConnectionId(null);
  }

  function chooseBackendService(key: keyof ArchitectureAssignments["backendServices"], id: string) {
    setAssignments((current) => ({ ...current, backendServices: { ...current.backendServices, [key]: id } }));
    setActiveStepIndex(0);
    setSelectedConnectionId(null);
  }

  function loadPolyglotExample(group: "frontend" | "backend") {
    if (group === "frontend") setAssignments((current) => ({ ...current, frontendApps: { catalog: "react", account: "angular", checkout: "vue" } }));
    else setAssignments((current) => ({ ...current, backendServices: { identity: "spring", catalog: "fastapi", orders: "express" } }));
    setActiveStepIndex(0);
    setSelectedConnectionId(null);
  }

  function chooseLens(nextLens: DiagramLens) {
    setLens(nextLens);
    setActiveStepIndex(0);
    setSelectedConnectionId(null);
  }

  function chooseStep(index: number) {
    setActiveStepIndex(index);
    setSelectedConnectionId(null);
  }

  function focusExampleElement(id: string, type: "node" | "edge") {
    const index = example.steps.findIndex((step) => (type === "node" ? step.nodeIds : step.edgeIds).includes(id));
    if (index >= 0) chooseStep(index);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Link copied");
      window.setTimeout(() => setShareLabel("Share configuration"), 1600);
    } catch {
      setShareLabel("Copy the URL above");
    }
  }

  return (
    <div className="architect-app">
      <section className="architect-intro shell">
        <div><span className="section-index">STACK ARCHITECT · DECISION LAB</span><h1>Compose a stack.<br /><em>Trace the real system.</em></h1></div>
        <div className="architect-intro__copy"><p>Select technologies and patterns, then assign different frameworks to individual microfrontends or microservices. StackScope expands the result into concrete runtime and delivery topologies and explains every boundary.</p><div><button type="button" className="button button--primary" onClick={share}>{shareLabel} <span aria-hidden="true">↗</span></button><button type="button" className="architect-reset" onClick={() => { setSelection(defaultStack); setAssignments(defaultArchitectureAssignments(defaultStack)); chooseLens("runtime"); }}>Reset stack</button></div></div>
      </section>

      <section className="architect-workbench shell" aria-label="Stack compatibility workbench">
        <aside className="technology-picker" aria-label="Choose technologies">
          <div className="technology-picker__heading"><span>01</span><div><strong>Technology palette</strong><small>Choose one per layer</small></div></div>
          {categoryOrder.map((category, index) => (
            <fieldset key={category}>
              <legend><span>{String(index + 1).padStart(2, "0")}</span>{categoryLabels[category]}</legend>
              <div className="technology-options">
                {technologiesByCategory[category].map((technology) => (
                  <label key={technology.id} className={selection[category] === technology.id ? "is-selected" : ""}>
                    <input type="radio" name={category} value={technology.id} checked={selection[category] === technology.id} onChange={() => choose(category, technology.id)} />
                    <span className="technology-option__mark" aria-hidden="true">{technology.mark}</span>
                    <span><strong>{technology.name}</strong><small>{technology.runtime}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </aside>

        {(selection.frontendArchitecture === "microfrontends" || selection.backendArchitecture === "microservices") && <section className="polyglot-configurator" aria-label="Framework-agnostic composition">
          <header><span>02</span><div><strong>Framework-agnostic composition</strong><small>Assign a runtime per independently deployed boundary</small></div></header>
          <div className="polyglot-configurator__groups">
            {selection.frontendArchitecture === "microfrontends" && <article className="polyglot-group">
              <div className="polyglot-group__heading"><div><span>FRONTEND APPLICATIONS</span><h3>One product, independent frameworks</h3><p>Path routing and the browser URL are the integration boundary. The default shell uses <strong>{analysis.selected.frontend.name}</strong>; child applications can use other frameworks.</p></div><button type="button" onClick={() => loadPolyglotExample("frontend")}>Load mixed example</button></div>
              <div className="assignment-grid">
                <div className="assignment-row assignment-row--fixed"><span>DEFAULT APP</span><strong>Product shell</strong><b>{analysis.selected.frontend.name}</b><small>Navigation · identity bootstrap · fallbacks</small></div>
                {(["catalog", "account", "checkout"] as const).map((key) => <label className="assignment-row" key={key}><span>{`/${key}/*`}</span><strong>{key[0].toUpperCase() + key.slice(1)} app</strong><select aria-label={`${key} microfrontend framework`} value={assignments.frontendApps[key]} onChange={(event) => chooseFrontendApp(key, event.target.value)}>{technologiesByCategory.frontend.map((technology) => <option key={technology.id} value={technology.id}>{technology.name}</option>)}</select><small>Independent build, deployment, assets, and rollback</small></label>)}
              </div>
              <div className="polyglot-impact"><span className="polyglot-impact__status">POSSIBLE</span><strong>{frontendFrameworkCount} framework{frontendFrameworkCount === 1 ? "" : "s"} across 4 applications</strong><p>{frontendFrameworkCount > 1 ? "Framework runtime and state cannot be the shared contract. Standardize URL ownership, identity, design tokens, accessibility, browser events, asset prefixes, and observability." : "A shared framework reduces toolchain variety, but each application still needs independent routing, ownership, testing, deployment, and fallback behavior."}</p></div>
            </article>}

            {selection.backendArchitecture === "microservices" && <article className="polyglot-group">
              <div className="polyglot-group__heading"><div><span>BACKEND SERVICES</span><h3>Polyglot services behind stable contracts</h3><p>Each service owns its runtime and artifact. HTTP, OpenAPI, events, identity, and telemetry—not framework libraries—connect the services.</p></div><button type="button" onClick={() => loadPolyglotExample("backend")}>Load mixed example</button></div>
              <div className="assignment-grid">
                {(["identity", "catalog", "orders"] as const).map((key) => <label className="assignment-row" key={key}><span>{key.toUpperCase()}</span><strong>{key[0].toUpperCase() + key.slice(1)} service</strong><select aria-label={`${key} service framework`} value={assignments.backendServices[key]} onChange={(event) => chooseBackendService(key, event.target.value)}>{technologiesByCategory.backend.map((technology) => <option key={technology.id} value={technology.id}>{technology.name}</option>)}</select><small>Own API/event schema, image, data access, and rollout</small></label>)}
              </div>
              <div className="polyglot-impact"><span className="polyglot-impact__status">POSSIBLE</span><strong>{backendFrameworkCount} runtime{backendFrameworkCount === 1 ? "" : "s"} across 3 services</strong><p>{backendFrameworkCount > 1 ? "CI needs a toolchain matrix and each service needs an isolated artifact. Standardize protocol schemas, error semantics, timeouts, authorization, traces, metrics, and dependency policy." : "One runtime simplifies CI and platform expertise, but services remain independent only when their APIs, data, deployments, and failure policies are independently owned."}</p></div>
            </article>}
          </div>
        </section>}

        <div className="architecture-analysis">
          <header className={`compatibility-verdict compatibility-verdict--${analysis.level}`} role="status">
            <div><span className="compatibility-verdict__signal"><i />{levelLabels[analysis.level]}</span><h2>{analysis.headline}</h2><p>{analysis.summary}</p></div>
            <dl><div><dt>Selected</dt><dd>{String(categoryOrder.length).padStart(2, "0")}</dd></div><div><dt>Example nodes</dt><dd>{String(example.nodes.length).padStart(2, "0")}</dd></div><div><dt>Decisions</dt><dd>{String(analysis.findings.filter((item) => item.level !== "note").length).padStart(2, "0")}</dd></div></dl>
          </header>

          <div className="example-heading">
            <div><span>{lens === "runtime" ? "CONCRETE REQUEST TOPOLOGY" : "CONCRETE RELEASE TOPOLOGY"}</span><h2>{example.title}</h2><p>{example.subtitle}</p></div>
            <div className="map-lens-switch" aria-label="Diagram view">
              <button type="button" aria-pressed={lens === "runtime"} onClick={() => chooseLens("runtime")}><span>01</span> Runtime example</button>
              <button type="button" aria-pressed={lens === "delivery"} onClick={() => chooseLens("delivery")}><span>02</span> Delivery example</button>
            </div>
          </div>

          <div className="architecture-map" data-testid="architecture-map">
            <div className="architecture-map__chrome"><span>{activeStep.number} · {activeStep.phase}</span><div className="architecture-legend"><span><i className="legend-request" /> Request</span><span><i className="legend-data" /> Data</span><span><i className="legend-artifact" /> Artifact</span><span><i className="legend-delivery" /> Control</span></div></div>
            <ReactFlow
              key={`${lens}-${Object.values(selection).join("-")}`}
              nodes={nodes}
              edges={edges}
              nodesConnectable={false}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.36}
              maxZoom={1.5}
              onNodeClick={(_, graphNode) => focusExampleElement(graphNode.id, "node")}
              onEdgeClick={(_, graphEdge) => focusExampleElement(graphEdge.id, "edge")}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#26303d" gap={24} size={1} />
              <Controls showInteractive={false} position="bottom-left" />
            </ReactFlow>
            <div className="connection-inspector" aria-live="polite">
              <span>{selectedConnection ? "SELECTED COMMUNICATION CONTRACT" : `${activeStep.number} · ${activeStep.phase}`}</span>
              {selectedConnection ? <><strong>{categoryLabels[selectedConnection.source]} → {categoryLabels[selectedConnection.target]}</strong><b>{selectedConnection.label}</b><p>{selectedConnection.detail}</p></> : <><strong>{activeStep.title}</strong><b>EXAMPLE IN FOCUS</b><p>{activeStep.concreteExample}</p></>}
            </div>
          </div>

          <div className="architecture-walkthrough" aria-label={`${lens} architecture walkthrough`}>
            <div className="walkthrough-index" role="tablist" aria-label="Architecture steps">
              {example.steps.map((step, index) => <button type="button" role="tab" aria-selected={index === activeStepIndex} key={step.id} onClick={() => chooseStep(index)}><span>{step.number}</span><small>{step.phase}</small><strong>{step.title}</strong></button>)}
            </div>
            <article className="walkthrough-detail" aria-labelledby={`step-${activeStep.id}`}>
              <header><span>{activeStep.number} / {activeStep.phase}</span><h3 id={`step-${activeStep.id}`}>{activeStep.title}</h3></header>
              <div className="walkthrough-detail__grid">
                <section><span>WHAT HAPPENS</span><p>{activeStep.whatHappens}</p></section>
                <section><span>CONCRETE EXAMPLE</span><p>{activeStep.concreteExample}</p></section>
                <section className="walkthrough-risk"><span>WHAT BREAKS</span><p>{activeStep.failureMode}</p></section>
                <section className="walkthrough-decision"><span>ARCHITECT DECIDES</span><p>{activeStep.decision}</p></section>
              </div>
              <footer><div>{activeStep.technologyIds.map((id) => <code key={id}>{id}</code>)}</div><div><button type="button" disabled={activeStepIndex === 0} onClick={() => chooseStep(activeStepIndex - 1)}>← Previous</button><button type="button" disabled={activeStepIndex === example.steps.length - 1} onClick={() => chooseStep(activeStepIndex + 1)}>Next step →</button></div></footer>
            </article>
          </div>

          <ol className="semantic-architecture sr-only">
            {example.steps.map((step) => <li key={step.id}>{step.phase}: {step.title}. {step.whatHappens} Example: {step.concreteExample} Failure: {step.failureMode} Decision: {step.decision}</li>)}
          </ol>
        </div>
      </section>

      <section className="technology-playbook shell">
        <div className="architect-report__heading"><span className="section-index">02 / SELECTED TECHNOLOGY PLAYBOOK</span><h2>What every choice actually owns.</h2><p>Each selected item has a distinct responsibility. These cards make the meaning, concrete use, communications, and operational risks explicit.</p></div>
        <div className="playbook-grid">
          {playbooks.map(({ technology, guide }, index) => <article key={technology.id} className="playbook-card">
            <header><span>{String(index + 1).padStart(2, "0")} · {categoryLabels[technology.category]}</span><div><i aria-hidden="true">{technology.mark}</i><h3>{technology.name}</h3></div></header>
            <section><strong>WHAT IT DOES</strong><p>{guide.meaning}</p></section>
            <section className="playbook-example"><strong>EXAMPLE IN THIS SYSTEM</strong><p>{guide.concreteExample}</p></section>
            <div className="playbook-lists"><section><strong>ARCHITECT OWNS</strong><ul>{guide.owns.map((item) => <li key={item}>{item}</li>)}</ul></section><section><strong>COMMUNICATES THROUGH</strong><ul>{guide.communicates.map((item) => <li key={item}>{item}</li>)}</ul></section><section><strong>WATCH FOR</strong><ul>{guide.watchFor.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
            <footer>{technology.docs.map((doc) => <a href={doc.url} target="_blank" rel="noreferrer" key={doc.url}>{doc.label} ↗</a>)}</footer>
          </article>)}
        </div>
      </section>

      <section className="architect-report shell">
        <div className="architect-report__heading"><span className="section-index">03 / ARCHITECTURE REVIEW</span><h2>What has to be true.</h2><p>Compatibility means every runtime, network, data, and delivery boundary has an explicit owner—not merely that integrations exist.</p></div>
        <div className="finding-list">
          {analysis.findings.map((finding) => (
            <article className={`finding finding--${finding.level}`} key={`${finding.title}-${finding.technologyIds.join("-")}`}>
              <span>{finding.level}</span><div><h3>{finding.title}</h3><p>{finding.detail}</p><div>{finding.technologyIds.map((id) => <code key={id}>{id}</code>)}</div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="communication-contracts">
        <div className="shell"><div className="architect-report__heading architect-report__heading--light"><span className="section-index">04 / COMMUNICATION CONTRACTS</span><h2>Follow the protocols.</h2><p>These are the concrete hand-offs an architecture decision record should preserve.</p></div>
          <div className="contract-grid">{analysis.connections.map((connection, index) => <button type="button" key={connection.id} onClick={() => { setSelectedConnectionId(connection.id); document.querySelector(".architecture-map")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><span>{String(index + 1).padStart(2, "0")}</span><small>{categoryLabels[connection.source]} → {categoryLabels[connection.target]}</small><strong>{connection.label}</strong><p>{connection.detail}</p></button>)}</div>
        </div>
      </section>

      <section className="official-evidence shell">
        <div className="architect-report__heading"><span className="section-index">05 / PRIMARY EVIDENCE</span><h2>Verify against official docs.</h2><p>Every product claim in this configuration links to documentation maintained by the selected technology or platform.</p></div>
        <div className="evidence-grid">{sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span>{source.technology}</span><strong>{source.label}</strong><i aria-hidden="true">↗</i></a>)}</div>
      </section>
    </div>
  );
}
