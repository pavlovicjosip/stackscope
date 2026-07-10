import {
  categoryOrder,
  defaultStack,
  technologies,
  technologiesByCategory,
  type ArchitectureConnection,
  type ArchitectureAssignments,
  type ArchitectureFinding,
  type StackAnalysis,
  type StackSelection,
  type Technology,
  type TechnologyCategory,
} from "@/content/architecture";

const databaseDrivers: Record<string, Record<string, string>> = {
  express: { postgres: "node-postgres / PostgreSQL wire", mysql: "MySQL Node connector", mongodb: "MongoDB Node driver / BSON" },
  fastapi: { postgres: "Python PostgreSQL driver / SQL", mysql: "MySQL Connector/Python / SQL", mongodb: "PyMongo / BSON" },
  spring: { postgres: "JDBC PostgreSQL driver / SQL", mysql: "MySQL Connector/J / SQL", mongodb: "Spring Data MongoDB / BSON" },
};

function selectedTechnology(category: TechnologyCategory, id: string): Technology {
  const technology = technologiesByCategory[category].find((item) => item.id === id);
  if (!technology) throw new Error(`Unknown ${category} technology: ${id}`);
  return technology;
}

const frontendAssignmentKeys = ["catalog", "account", "checkout"] as const;
const backendAssignmentKeys = ["identity", "catalog", "orders"] as const;

export function defaultArchitectureAssignments(selection: StackSelection = defaultStack): ArchitectureAssignments {
  return {
    frontendApps: { catalog: selection.frontend, account: selection.frontend, checkout: selection.frontend },
    backendServices: { identity: selection.backend, catalog: selection.backend, orders: selection.backend },
  };
}

export function normalizeArchitectureAssignments(input: Partial<{ frontendApps: Partial<ArchitectureAssignments["frontendApps"]>; backendServices: Partial<ArchitectureAssignments["backendServices"]> }> | undefined, selection: StackSelection): ArchitectureAssignments {
  const validFrontend = new Set(technologiesByCategory.frontend.map((item) => item.id));
  const validBackend = new Set(technologiesByCategory.backend.map((item) => item.id));
  return {
    frontendApps: Object.fromEntries(frontendAssignmentKeys.map((key) => [key, validFrontend.has(input?.frontendApps?.[key] ?? "") ? input?.frontendApps?.[key] : selection.frontend])) as ArchitectureAssignments["frontendApps"],
    backendServices: Object.fromEntries(backendAssignmentKeys.map((key) => [key, validBackend.has(input?.backendServices?.[key] ?? "") ? input?.backendServices?.[key] : selection.backend])) as ArchitectureAssignments["backendServices"],
  };
}

export function normalizeStackSelection(input: Partial<StackSelection>): StackSelection {
  return Object.fromEntries(categoryOrder.map((category) => {
    const requested = input[category];
    const valid = technologiesByCategory[category].some((item) => item.id === requested);
    return [category, valid ? requested : defaultStack[category]];
  })) as StackSelection;
}

export function parseStackParams(params: URLSearchParams): StackSelection {
  return normalizeStackSelection(Object.fromEntries(categoryOrder.map((category) => [category, params.get(category) ?? undefined])));
}

export function parseArchitectureAssignments(params: URLSearchParams, selection: StackSelection): ArchitectureAssignments {
  return normalizeArchitectureAssignments({
    frontendApps: { catalog: params.get("mfeCatalog") ?? undefined, account: params.get("mfeAccount") ?? undefined, checkout: params.get("mfeCheckout") ?? undefined },
    backendServices: { identity: params.get("svcIdentity") ?? undefined, catalog: params.get("svcCatalog") ?? undefined, orders: params.get("svcOrders") ?? undefined },
  }, selection);
}

export function toStackParams(selection: StackSelection, assignments?: ArchitectureAssignments): URLSearchParams {
  const params = new URLSearchParams();
  for (const category of categoryOrder) params.set(category, selection[category]);
  if (assignments && selection.frontendArchitecture === "microfrontends") {
    params.set("mfeCatalog", assignments.frontendApps.catalog);
    params.set("mfeAccount", assignments.frontendApps.account);
    params.set("mfeCheckout", assignments.frontendApps.checkout);
  }
  if (assignments && selection.backendArchitecture === "microservices") {
    params.set("svcIdentity", assignments.backendServices.identity);
    params.set("svcCatalog", assignments.backendServices.catalog);
    params.set("svcOrders", assignments.backendServices.orders);
  }
  return params;
}

export function analyzeStack(input: StackSelection, assignmentInput?: Partial<{ frontendApps: Partial<ArchitectureAssignments["frontendApps"]>; backendServices: Partial<ArchitectureAssignments["backendServices"]> }>): StackAnalysis {
  const selection = normalizeStackSelection(input);
  const selected = Object.fromEntries(categoryOrder.map((category) => [category, selectedTechnology(category, selection[category])])) as Record<TechnologyCategory, Technology>;
  const assignments = normalizeArchitectureAssignments(assignmentInput, selection);
  const frontendFrameworks = selected.frontendArchitecture.id === "microfrontends"
    ? [selected.frontend, ...Object.values(assignments.frontendApps).map((id) => selectedTechnology("frontend", id))]
    : [selected.frontend];
  const backendFrameworks = selected.backendArchitecture.id === "microservices"
    ? Object.values(assignments.backendServices).map((id) => selectedTechnology("backend", id))
    : [selected.backend];
  const uniqueFrontends = [...new Map(frontendFrameworks.map((technology) => [technology.id, technology])).values()];
  const uniqueBackends = [...new Map(backendFrameworks.map((technology) => [technology.id, technology])).values()];
  const frontendNames = uniqueFrontends.map((technology) => technology.name).join(", ");
  const backendNames = uniqueBackends.map((technology) => technology.name).join(", ");
  const findings: ArchitectureFinding[] = [];
  const connections: ArchitectureConnection[] = [];
  const addFinding = (finding: ArchitectureFinding) => findings.push(finding);
  const addConnection = (connection: ArchitectureConnection) => connections.push(connection);

  addConnection({ id: "frontend-architecture", source: "frontendArchitecture", target: "frontend", label: "composition model", detail: `${selected.frontendArchitecture.name} defines how ${frontendNames} are rendered, split, routed, and owned.`, kind: "request" });
  addConnection({ id: "backend-architecture", source: "backendArchitecture", target: "backend", label: "service boundary", detail: `${selected.backendArchitecture.name} defines deployment and ownership boundaries around ${backendNames}.`, kind: "request" });
  addConnection({ id: "frontend-backend", source: "frontend", target: "backend", label: "HTTPS + JSON", detail: `${frontendNames} call ${backendNames} through framework-neutral, versioned HTTP APIs.`, kind: "request" });
  addConnection({ id: "backend-database", source: "backend", target: "database", label: uniqueBackends.length > 1 ? "per-service official drivers" : databaseDrivers[selected.backend.id][selected.database.id], detail: uniqueBackends.length > 1 ? `${backendNames} independently own credentials, pooling, queries, migrations, and transaction boundaries for their ${selected.database.name} data.` : `${backendNames} owns credentials, pooling, queries, migrations, and transaction boundaries for ${selected.database.name}.`, kind: "data" });
  addConnection({ id: "ci-frontend", source: "ci", target: "frontend", label: "build + test matrix", detail: `${selected.ci.name} checks each ${frontendNames} application and produces independently deployable frontend output.`, kind: "delivery" });
  addConnection({ id: "ci-backend", source: "ci", target: "backend", label: "build + test matrix", detail: `${selected.ci.name} runs the correct toolchain for ${backendNames} before promotion.`, kind: "delivery" });
  addConnection({ id: "ci-iac", source: "ci", target: "iac", label: "validate + plan", detail: `${selected.ci.name} validates ${selected.iac.name} changes and preserves an approval boundary before infrastructure mutation.`, kind: "delivery" });
  addConnection({ id: "ci-packaging", source: "ci", target: "packaging", label: selected.packaging.id === "docker" ? "build + push image" : "publish build output", detail: `${selected.ci.name} produces the immutable application artifact.`, kind: "artifact" });
  addConnection({ id: "iac-deployment", source: "iac", target: "deployment", label: "plan + apply resources", detail: `${selected.iac.name} declares the networking, identity, compute, and ${selected.deployment.name} resources for each environment.`, kind: "artifact" });
  addConnection({ id: "packaging-compute", source: "packaging", target: "compute", label: selected.packaging.id === "docker" ? "OCI image" : "source / assets", detail: `${selected.compute.name} receives the packaged revision at runtime or provider build time.`, kind: "artifact" });
  addConnection({ id: "deployment-compute", source: "deployment", target: "compute", label: "schedule + operate", detail: `${selected.deployment.name} places revisions onto ${selected.compute.name} and maintains their desired state.`, kind: "delivery" });
  addConnection({ id: "deployment-frontend", source: "deployment", target: "frontend", label: "HTTPS delivery", detail: `${selected.deployment.name} exposes the frontend through a public endpoint, CDN, or load balancer.`, kind: "delivery" });
  addConnection({ id: "deployment-backend", source: "deployment", target: "backend", label: "runtime + service endpoint", detail: `${selected.deployment.name} starts the ${selected.backend.name} runtime and exposes a stable service endpoint for application traffic.`, kind: "delivery" });

  if ((selected.deployment.id === "kubernetes" || selected.deployment.id === "ecs") && selected.packaging.id !== "docker") {
    addFinding({ level: "blocker", title: `${selected.deployment.name} needs a container image`, detail: `${selected.deployment.name} schedules container workloads. Select Docker image packaging so CI can publish an image the platform can pull.`, technologyIds: [selected.deployment.id, selected.packaging.id] });
  }

  if (selected.deployment.id === "ecs" && selected.compute.id === "vercel-functions") {
    addFinding({ level: "blocker", title: "Amazon ECS cannot schedule Vercel Functions", detail: "ECS schedules containers onto Fargate or EC2 capacity. Select AWS Fargate or Amazon EC2, or move the deployment target to Vercel.", technologyIds: ["ecs", "vercel-functions"] });
  }

  if (selected.deployment.id === "vercel" && selected.compute.id !== "vercel-functions") {
    addFinding({ level: "blocker", title: `Vercel does not manage ${selected.compute.name}`, detail: "This configuration mixes two compute control planes. Select Vercel Functions for a single-platform design, or model the AWS workload as a separate deployment.", technologyIds: ["vercel", selected.compute.id] });
  }

  if (selected.deployment.id === "kubernetes" && selected.compute.id === "vercel-functions") {
    addFinding({ level: "blocker", title: "Kubernetes cannot schedule Vercel Functions", detail: "Kubernetes schedules Pods onto cluster compute. Select EC2 nodes or AWS Fargate with Amazon EKS, or move the deployment target to Vercel.", technologyIds: ["kubernetes", "vercel-functions"] });
  }

  if (selected.deployment.id === "kubernetes" && selected.compute.id === "fargate") {
    addFinding({ level: "warning", title: "Kubernetes on Fargate means Amazon EKS", detail: "Use EKS Fargate profiles and account for private subnets, IP target mode, no DaemonSets, no privileged containers, and no GPUs. Generic Kubernetes alone does not supply Fargate.", technologyIds: ["kubernetes", "fargate"] });
  }

  if (selected.iac.id === "cloudformation" && selected.deployment.id === "vercel") {
    addFinding({ level: "blocker", title: "CloudFormation cannot own a Vercel deployment", detail: "CloudFormation provisions AWS resources. Choose Terraform or Pulumi for a Vercel-aware provider workflow, or separate AWS infrastructure from the Vercel project lifecycle.", technologyIds: ["cloudformation", "vercel"] });
  }

  if (selected.iac.id === "cloudformation" && selected.deployment.id === "kubernetes") {
    addFinding({ level: "warning", title: "CloudFormation assumes an AWS Kubernetes distribution", detail: "Use it to provision Amazon EKS and its AWS dependencies. For a provider-neutral Kubernetes target, Terraform or Pulumi is the clearer ownership model.", technologyIds: ["cloudformation", "kubernetes"] });
  }

  if (selected.deployment.id === "kubernetes") {
    addFinding({ level: "note", title: "Add Service discovery and ingress", detail: "Run stateless frontend/backend workloads as Deployments, expose stable in-cluster endpoints with Services, and define an ingress or Gateway for public HTTP traffic.", technologyIds: ["kubernetes"] });
  }

  if (selected.deployment.id === "ecs") {
    addFinding({ level: "note", title: "Define tasks, health checks, and load balancing", detail: "Publish the image to a registry, reference it from an ECS task definition, and route HTTP traffic through an Application Load Balancer with health checks.", technologyIds: ["ecs"] });
  }

  if (selected.deployment.id === "vercel") {
    addFinding({ level: "note", title: "Keep the database behind server-side code", detail: "The browser should call a server route or function. Store database credentials in protected environment variables and account for function connection concurrency.", technologyIds: ["vercel", selected.database.id] });
    if (uniqueBackends.some((technology) => technology.id === "spring")) {
      addFinding({ level: "warning", title: "Spring Boot is not a native Vercel function runtime", detail: "Treat Vercel as the frontend tier and deploy the JVM backend to a container platform, or explicitly validate Vercel container-image limits before choosing a single-platform design.", technologyIds: ["spring", "vercel"] });
    }
  }

  if (selected.frontendArchitecture.id === "ssr-bff" && (selected.frontend.id === "react" || selected.frontend.id === "vue")) {
    addFinding({ level: "warning", title: `${selected.frontend.name} needs an SSR-capable framework`, detail: `The core ${selected.frontend.name} library does not define a production BFF runtime by itself. Select and govern a compatible full-stack framework before treating SSR and server routes as deployable.`, technologyIds: [selected.frontend.id, "ssr-bff"] });
  }

  if (selected.frontendArchitecture.id === "microfrontends") {
    addFinding({ level: "warning", title: "Microfrontends require organizational boundaries, not only routing", detail: "Define a shell/default application, path ownership, shared identity and design contracts, local fallbacks, independent releases, and cross-application observability before splitting the UI.", technologyIds: ["microfrontends", selected.frontend.id] });
    if (selected.deployment.id === "vercel") {
      addFinding({ level: "note", title: "Vercel can route independently deployed microfrontends", detail: "Use a microfrontends group and configuration to keep applications under a shared domain with explicit path routing and preview fallbacks.", technologyIds: ["microfrontends", "vercel"] });
    }
    if (uniqueFrontends.length > 1) {
      addFinding({ level: "note", title: "Mixed frontend frameworks are compatible at application boundaries", detail: `${frontendNames} can share one product when routing happens between independently built applications. Expect hard navigation unless the composition platform optimizes it; share design tokens, identity, URLs, and browser events rather than framework components or in-memory state.`, technologyIds: ["microfrontends", ...uniqueFrontends.map((technology) => technology.id)] });
    }
  }

  if (selected.backendArchitecture.id === "microservices") {
    addFinding({ level: "warning", title: "One database engine must not become one shared ownership boundary", detail: `Multiple services may use ${selected.database.name}, but each service should own its schema or database and migrations. Shared tables recreate monolith coupling over the network.`, technologyIds: ["microservices", selected.database.id] });
    if (selected.deployment.id === "kubernetes" || selected.deployment.id === "ecs") {
      addFinding({ level: "note", title: "Make service discovery and failure policy explicit", detail: `Use ${selected.deployment.name} service discovery, timeouts, bounded retries, health signals, and per-service rollout ownership rather than direct task or Pod addresses.`, technologyIds: ["microservices", selected.deployment.id] });
    }
    if (uniqueBackends.length > 1) {
      addFinding({ level: "note", title: "Polyglot services are compatible through network contracts", detail: `${backendNames} can coexist because each service owns its runtime and artifact. Standardize OpenAPI or event schemas, identity, timeouts, telemetry, and error semantics; do not share framework libraries as the integration boundary.`, technologyIds: ["microservices", ...uniqueBackends.map((technology) => technology.id)] });
    }
  }

  if (selected.backendArchitecture.id === "serverless" && selected.compute.id !== "vercel-functions") {
    addFinding({ level: "warning", title: `${selected.compute.name} is not a function runtime`, detail: "Fargate and EC2 run containers or virtual machines rather than provider-managed functions. Add an actual functions platform or rename the approach to services so scaling and lifecycle assumptions remain honest.", technologyIds: ["serverless", selected.compute.id] });
  }

  if (selected.frontend.id === "next" && selected.backend.id === "express") {
    addFinding({ level: "warning", title: "Clarify the boundary between two Node server layers", detail: "Next.js can own server routes itself. Keep Express only when it is an independently deployed API, serves other clients, or needs a separate scaling and release boundary.", technologyIds: ["next", "express"] });
  }

  if (uniqueFrontends.some((technology) => technology.id !== "next")) {
    addFinding({ level: "note", title: "Configure browser-to-API origin policy", detail: `If ${selected.frontend.name} and ${selected.backend.name} use different origins, configure CORS narrowly and keep authentication cookies or tokens aligned with that boundary.`, technologyIds: [selected.frontend.id, selected.backend.id] });
  }

  if (selected.ci.id === "jenkins") {
    addFinding({ level: "warning", title: "Jenkins adds an operational control plane", detail: "Plan controller upgrades, plugin governance, agent isolation, credential rotation, and recovery. Its flexibility is compatible, but it is not a managed runner service by default.", technologyIds: ["jenkins"] });
  }

  for (const backend of uniqueBackends) {
    addFinding({ level: "note", title: `${backend.name} ↔ ${selected.database.name}: use the supported driver boundary`, detail: `Connect through ${databaseDrivers[backend.id][selected.database.id]}. Keep credentials server-side, pool connections, version migrations, and encrypt remote traffic.`, technologyIds: [backend.id, selected.database.id] });
  }

  const blockers = findings.filter((item) => item.level === "blocker").length;
  const warnings = findings.filter((item) => item.level === "warning").length;
  const level = blockers > 0 ? "incompatible" : warnings > 0 ? "conditional" : "compatible";
  const headline = level === "compatible" ? "This stack has a clear delivery path." : level === "conditional" ? "Compatible—with architectural decisions to make." : "This design has unresolved platform constraints.";
  const summary = blockers > 0
    ? `Resolve ${blockers} blocking ${blockers === 1 ? "constraint" : "constraints"} before treating this as deployable.`
    : warnings > 0
      ? `${warnings} trade-off ${warnings === 1 ? "needs" : "need"} an explicit decision record; the underlying protocols are compatible.`
      : "The selected tools have documented runtime, driver, artifact, and network paths between every layer.";

  return { level, headline, summary, findings, connections, selected, assignments };
}

export function officialSourcesForAnalysis(analysis: StackAnalysis) {
  const assignedIds = analysis.selected.frontendArchitecture.id === "microfrontends" ? Object.values(analysis.assignments.frontendApps) : [];
  if (analysis.selected.backendArchitecture.id === "microservices") assignedIds.push(...Object.values(analysis.assignments.backendServices));
  const selectedTechnologies = [...categoryOrder.map((category) => analysis.selected[category]), ...assignedIds.map((id) => technologies.find((technology) => technology.id === id)).filter((technology): technology is Technology => Boolean(technology))];
  const unique = [...new Map(selectedTechnologies.map((technology) => [technology.id, technology])).values()];
  return unique.flatMap((technology) => technology.docs.map((source) => ({ ...source, technology: technology.name })));
}

export const allTechnologyIds = new Set(technologies.map((technology) => technology.id));
