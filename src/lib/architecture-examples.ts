import { technologiesByCategory, type StackAnalysis, type Technology } from "@/content/architecture";

export type DiagramLens = "runtime" | "delivery";

export type ExampleNode = {
  id: string;
  eyebrow: string;
  label: string;
  technology: string;
  summary: string;
  position: { x: number; y: number };
  kind: "actor" | "frontend" | "boundary" | "service" | "data" | "delivery" | "compute";
};

export type ExampleEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  detail: string;
  kind: "request" | "data" | "delivery" | "artifact";
};

export type ExampleStep = {
  id: string;
  number: string;
  phase: string;
  title: string;
  nodeIds: string[];
  edgeIds: string[];
  whatHappens: string;
  concreteExample: string;
  failureMode: string;
  decision: string;
  technologyIds: string[];
};

export type ArchitectureExample = {
  title: string;
  subtitle: string;
  nodes: ExampleNode[];
  edges: ExampleEdge[];
  steps: ExampleStep[];
};

function node(id: string, eyebrow: string, label: string, technology: string, summary: string, x: number, y: number, kind: ExampleNode["kind"]): ExampleNode {
  return { id, eyebrow, label, technology, summary, position: { x, y }, kind };
}

function edge(id: string, source: string, target: string, label: string, detail: string, kind: ExampleEdge["kind"]): ExampleEdge {
  return { id, source, target, label, detail, kind };
}

function frontendTopology(frontend: Technology, approach: Technology, appFrameworks?: { catalog: Technology; account: Technology; checkout: Technology }) {
  if (approach.id === "microfrontends") {
    const frameworks = appFrameworks ?? { catalog: frontend, account: frontend, checkout: frontend };
    const frameworkNames = [...new Set([frontend.name, ...Object.values(frameworks).map((technology) => technology.name)])];
    return {
      nodes: [
        node("browser", "ACTOR", "Customer browser", "Web platform", "Loads one product URL and follows links without knowing which team owns each screen.", 0, 235, "actor"),
        node("shell", "DEFAULT APP", "Product shell", `${frontend.name} host`, "Owns the shared domain, top-level navigation, identity bootstrap, error fallback, and design-system contract.", 260, 235, "frontend"),
        node("catalog-mfe", "TEAM: CATALOG", "Catalog frontend", frameworks.catalog.name, `Independently built ${frameworks.catalog.name} application mounted for /catalog/* routes.`, 540, 25, "frontend"),
        node("account-mfe", "TEAM: IDENTITY", "Account frontend", frameworks.account.name, `Independently built ${frameworks.account.name} application mounted for /account/* routes.`, 540, 235, "frontend"),
        node("checkout-mfe", "TEAM: CHECKOUT", "Checkout frontend", frameworks.checkout.name, `Independently built ${frameworks.checkout.name} application mounted for /checkout/* routes.`, 540, 445, "frontend"),
      ],
      edges: [
        edge("browser-shell", "browser", "shell", "GET /", "The shared domain resolves to the default application, which supplies the product frame and route fallback.", "request"),
        edge("shell-catalog", "shell", "catalog-mfe", "/catalog/*", "The routing layer sends catalog paths to the catalog deployment while preserving the shared public domain.", "request"),
        edge("shell-account", "shell", "account-mfe", "/account/*", "Account routes resolve to the identity team's deployment; the shell passes only an agreed identity contract.", "request"),
        edge("shell-checkout", "shell", "checkout-mfe", "/checkout/*", "Checkout routes resolve independently so this team can release without rebuilding the other applications.", "request"),
      ],
      exits: ["catalog-mfe", "account-mfe", "checkout-mfe"],
      title: frameworkNames.length > 1 ? `${frameworkNames.join(" + ")} microfrontends` : `${frontend.name} microfrontends split by product domain`,
      description: `The product is one domain but several independently owned frontend deployments${frameworkNames.length > 1 ? ` using ${frameworkNames.join(", ")}` : ""}. Path routing is framework-neutral; the shell coordinates URLs, identity, design tokens, and fallbacks rather than sharing framework runtime state.`,
      example: `Catalog ships /catalog/* with ${frameworks.catalog.name}, Identity ships /account/* with ${frameworks.account.name}, and Checkout ships /checkout/* with ${frameworks.checkout.name}. Each team builds and rolls back independently.`,
      failure: "A shared global store, framework-specific component imports across deployments, conflicting global CSS, or shell-owned business logic couples releases and removes the independence the pattern was meant to create.",
      decision: "Use microfrontends only when separate teams and release cadences justify routing, observability, accessibility, and cross-app consistency overhead.",
    };
  }

  if (approach.id === "ssr-bff") {
    return {
      nodes: [
        node("browser", "ACTOR", "Customer browser", "Web platform", "Requests HTML first, then hydrates interactive client code.", 0, 235, "actor"),
        node("renderer", "RENDERING TIER", "SSR renderer", frontend.name, "Builds route-specific HTML on the server and streams or returns it to the browser.", 280, 155, "frontend"),
        node("bff", "UI API", "Backend for frontend", `${frontend.name} server`, "Aggregates backend data into the exact shape needed by the current page; it is not the system of record.", 550, 315, "boundary"),
      ],
      edges: [
        edge("browser-renderer", "browser", "renderer", "GET /orders/42", "The renderer handles the document request and returns server-produced HTML for the route.", "request"),
        edge("renderer-bff", "renderer", "bff", "server call", "The rendering tier asks its BFF for a page-shaped model rather than exposing internal services to the browser.", "request"),
      ],
      exits: ["bff"],
      title: `${frontend.name} server rendering with a BFF`,
      description: "A frontend server renders the initial document and owns a UI-specific API boundary. The browser still hydrates interactive code after the first response.",
      example: "GET /orders/42 renders the order page; the BFF combines order, customer, and permission data into one page model.",
      failure: "Putting core business rules in the BFF duplicates domain logic and creates different behavior for web, mobile, and service consumers.",
      decision: "Choose this when initial rendering, SEO, or UI-shaped aggregation matters enough to operate a frontend server tier.",
    };
  }

  return {
    nodes: [
      node("browser", "ACTOR", "Customer browser", "Web platform", "Downloads one application bundle and performs navigation after the initial document load.", 0, 235, "actor"),
      node("spa-shell", "APPLICATION", "SPA shell + router", frontend.name, "Owns client routes, screens, local UI state, and loading/error boundaries.", 285, 155, "frontend"),
      node("api-client", "CLIENT BOUNDARY", "Typed API client", frontend.name, "Adds authentication, serializes requests, parses responses, and centralizes timeout/error behavior.", 555, 315, "boundary"),
    ],
    edges: [
      edge("browser-spa", "browser", "spa-shell", "HTML + JS", "The browser loads static assets, starts the application, and lets the client router replace views.", "request"),
      edge("spa-client", "spa-shell", "api-client", "function call", "Screens call a typed client instead of scattering fetch and error handling through components.", "request"),
    ],
    exits: ["api-client"],
    title: `${frontend.name} single-page application`,
    description: "One browser application owns navigation and calls a remote API after boot. Static hosting and API deployment are separate operational boundaries.",
    example: "The Orders screen calls api.orders.list(); the client sends GET /api/orders with the user's access token.",
    failure: "Large bundles, client-only authorization assumptions, and inconsistent request handling create slow startup and security or reliability gaps.",
    decision: "Use a SPA when rich post-load interaction matters and client rendering, browser compatibility, and API ownership are acceptable trade-offs.",
  };
}

function backendTopology(backend: Technology, approach: Technology, database: Technology, deployment: Technology, compute: Technology, serviceFrameworks?: { identity: Technology; catalog: Technology; orders: Technology }) {
  const runtime = `${backend.name} · ${compute.name}`;
  if (approach.id === "microservices") {
    const frameworks = serviceFrameworks ?? { identity: backend, catalog: backend, orders: backend };
    const frameworkNames = [...new Set(Object.values(frameworks).map((technology) => technology.name))];
    return {
      nodes: [
        node("api-entry", "NETWORK BOUNDARY", "API gateway / ingress", deployment.name, "Authenticates or routes requests, enforces shared limits, and exposes stable public paths; it does not own domain behavior.", 830, 235, "boundary"),
        node("identity-service", "SERVICE: IDENTITY", "Identity service", `${frameworks.identity.name} · ${compute.name}`, "Owns users, credentials, sessions, and the identity API. Its runtime is isolated in its own artifact.", 1110, 25, "service"),
        node("catalog-service", "SERVICE: CATALOG", "Catalog service", `${frameworks.catalog.name} · ${compute.name}`, "Owns products and catalog queries behind a framework-neutral network contract.", 1110, 235, "service"),
        node("order-service", "SERVICE: ORDERS", "Order service", `${frameworks.orders.name} · ${compute.name}`, "Owns order state transitions and coordinates through explicit APIs or events, regardless of language runtime.", 1110, 445, "service"),
        node("identity-store", "OWNED DATA", "Identity database", database.name, "A separate database, schema, or access boundary whose credentials belong only to Identity.", 1430, 25, "data"),
        node("catalog-store", "OWNED DATA", "Catalog database", database.name, "Catalog is the only writer; other services use its API instead of querying its tables.", 1430, 235, "data"),
        node("order-store", "OWNED DATA", "Orders database", database.name, "Orders owns its transaction boundary and publishes facts needed by other domains.", 1430, 445, "data"),
      ],
      entry: "api-entry",
      edges: [
        edge("entry-identity", "api-entry", "identity-service", "/identity/*", "Ingress discovers and routes to healthy Identity replicas over an internal HTTP/gRPC contract.", "request"),
        edge("entry-catalog", "api-entry", "catalog-service", "/catalog/*", "Catalog traffic is independently routed, measured, scaled, and released.", "request"),
        edge("entry-orders", "api-entry", "order-service", "/orders/*", "Order requests go to the service that owns order state and its business invariants.", "request"),
        edge("identity-db", "identity-service", "identity-store", `${frameworks.identity.name} driver`, "Only Identity credentials can read or write identity-owned data through its runtime's supported driver.", "data"),
        edge("catalog-db", "catalog-service", "catalog-store", `${frameworks.catalog.name} driver`, "Catalog uses its own runtime driver and exposes needed data through an API or published event.", "data"),
        edge("orders-db", "order-service", "order-store", `${frameworks.orders.name} driver`, "Order transactions stop at this ownership boundary; cross-service consistency needs an explicit workflow.", "data"),
      ],
      serviceIds: ["identity-service", "catalog-service", "order-service"],
      storeIds: ["identity-store", "catalog-store", "order-store"],
      description: `The backend is three real service boundaries${frameworkNames.length > 1 ? ` implemented with ${frameworkNames.join(", ")}` : ""}. Framework choice stays inside each service; APIs, events, identity, observability, and error semantics form the shared contract.`,
      example: `POST /orders reaches the ${frameworks.orders.name} Order Service. It records Orders data, then calls or emits a framework-neutral fact to the ${frameworks.catalog.name} Catalog Service instead of importing its code or writing its tables.`,
      failure: "Shared framework libraries as contracts, shared tables, inconsistent telemetry/security, synchronous call chains without deadlines, and releases that must move together form a polyglot distributed monolith.",
      decision: "Split only where domain ownership, independent scaling, or release autonomy outweigh distributed transactions, observability, and operational cost.",
    };
  }

  if (approach.id === "serverless") {
    return {
      nodes: [
        node("api-entry", "EVENT SOURCE", "HTTP + event gateway", deployment.name, "Turns HTTP requests, schedules, or provider events into isolated function invocations.", 830, 235, "boundary"),
        node("auth-function", "FUNCTION", "Authenticate request", runtime, "A purpose-specific handler validates identity and returns a response for one invocation.", 1110, 25, "service"),
        node("catalog-function", "FUNCTION", "Read catalog", runtime, "A read handler is initialized on demand and reuses its execution environment when available.", 1110, 235, "service"),
        node("order-function", "FUNCTION", "Create order", runtime, "An order handler validates input and writes an order within its invocation timeout.", 1110, 445, "service"),
        node("function-store", "MANAGED DATA", "Application database", database.name, "Functions connect through bounded pools or a provider-aware proxy and never assume a permanent process.", 1430, 235, "data"),
      ],
      entry: "api-entry",
      edges: [
        edge("entry-auth", "api-entry", "auth-function", "invoke", "The gateway maps the request or event into the handler's event object.", "request"),
        edge("entry-catalog", "api-entry", "catalog-function", "invoke", "Each route invokes a purpose-specific handler and receives a bounded response.", "request"),
        edge("entry-orders", "api-entry", "order-function", "invoke", "The platform initializes, invokes, and eventually shuts down an isolated execution environment.", "request"),
        edge("auth-db", "auth-function", "function-store", database.protocols[0], "The handler obtains a connection through a bounded, reusable client or data proxy.", "data"),
        edge("catalog-db", "catalog-function", "function-store", database.protocols[0], "Read concurrency must not exhaust the database connection limit.", "data"),
        edge("orders-db", "order-function", "function-store", database.protocols[0], "Writes must be idempotent because an event can be retried.", "data"),
      ],
      serviceIds: ["auth-function", "catalog-function", "order-function"],
      storeIds: ["function-store"],
      description: "The backend becomes several event-triggered handlers. The provider owns servers and scaling; the architecture still owns timeouts, retries, idempotency, data connections, and observability.",
      example: "POST /orders invokes Create order with an event payload. The handler validates, writes once using an idempotency key, and returns before its timeout.",
      failure: "Unbounded database connections, large cold-start dependencies, or non-idempotent handlers fail when concurrency rises or an event is retried.",
      decision: "Use functions for event-shaped, bounded work; avoid pretending a long-lived, stateful server can be moved unchanged into an invocation model.",
    };
  }

  return {
    nodes: [
      node("api-entry", "NETWORK BOUNDARY", "API ingress", deployment.name, "Routes requests to one deployable backend application and checks instance health.", 830, 235, "boundary"),
      node("identity-module", "IN-PROCESS MODULE", "Identity module", runtime, "Owns identity use cases behind an internal interface in the same process.", 1110, 25, "service"),
      node("catalog-module", "IN-PROCESS MODULE", "Catalog module", runtime, "Owns catalog behavior without a network hop or independent deployment.", 1110, 235, "service"),
      node("order-module", "IN-PROCESS MODULE", "Orders module", runtime, "Owns order state transitions while participating in the application's local transaction boundary.", 1110, 445, "service"),
      node("shared-db", "ONE DEPLOYABLE'S DATA", "Application database", database.name, "One database can serve the application, but tables and repository interfaces still respect module ownership.", 1430, 235, "data"),
    ],
    entry: "api-entry",
    edges: [
      edge("entry-identity", "api-entry", "identity-module", "in-process dispatch", "The application router invokes the Identity module inside the same deployed process.", "request"),
      edge("entry-catalog", "api-entry", "catalog-module", "in-process dispatch", "Catalog calls stay local, so failures and transactions are simpler than remote service calls.", "request"),
      edge("entry-orders", "api-entry", "order-module", "in-process dispatch", "Orders remains a module boundary even though it ships in the same artifact.", "request"),
      edge("identity-db", "identity-module", "shared-db", database.protocols[0], "Identity repositories access identity-owned tables through an internal boundary.", "data"),
      edge("catalog-db", "catalog-module", "shared-db", database.protocols[0], "Catalog owns its schema area and does not expose arbitrary tables as an integration API.", "data"),
      edge("orders-db", "order-module", "shared-db", database.protocols[0], "A local transaction can update module-owned records without a distributed workflow.", "data"),
    ],
    serviceIds: ["identity-module", "catalog-module", "order-module"],
    storeIds: ["shared-db"],
    description: "One backend deployment contains several enforced domain modules. The example shows the modules because 'monolith' describes deployment, not absence of architecture.",
    example: "POST /orders dispatches to Orders in the same process. Orders uses its repository and can complete one local database transaction.",
    failure: "Controllers querying any table and circular module imports turn the application into an unstructured monolith that cannot evolve safely.",
    decision: "Start here when one team or release train benefits from local calls and transactions; extract a service only when a measured boundary needs autonomy.",
  };
}

function runtimeExample(analysis: StackAnalysis): ArchitectureExample {
  const { frontend, frontendArchitecture, backend, backendArchitecture, database, deployment, compute } = analysis.selected;
  const frontendById = (id: string) => technologiesByCategory.frontend.find((technology) => technology.id === id) ?? frontend;
  const backendById = (id: string) => technologiesByCategory.backend.find((technology) => technology.id === id) ?? backend;
  const front = frontendTopology(frontend, frontendArchitecture, {
    catalog: frontendById(analysis.assignments.frontendApps.catalog),
    account: frontendById(analysis.assignments.frontendApps.account),
    checkout: frontendById(analysis.assignments.frontendApps.checkout),
  });
  const back = backendTopology(backend, backendArchitecture, database, deployment, compute, {
    identity: backendById(analysis.assignments.backendServices.identity),
    catalog: backendById(analysis.assignments.backendServices.catalog),
    orders: backendById(analysis.assignments.backendServices.orders),
  });
  const bridgeEdges = front.exits.map((source, index) => edge(`frontend-api-${index}`, source, back.entry, "HTTPS · JSON", `${source} calls the stable API boundary. Authentication, CORS, timeouts, versioning, and error semantics must be explicit.`, "request"));
  const frontendNodeIds = front.nodes.filter((item) => item.kind === "frontend" || item.kind === "actor").map((item) => item.id);
  const frontendEdgeIds = front.edges.map((item) => item.id);
  const requestEdgeIds = [...bridgeEdges.map((item) => item.id), ...back.edges.filter((item) => item.kind === "request").map((item) => item.id)];
  const dataEdgeIds = back.edges.filter((item) => item.kind === "data").map((item) => item.id);

  return {
    title: `${front.title} → ${backendArchitecture.name}`,
    subtitle: `Concrete request path on ${deployment.name} and ${compute.name}. Select a step to isolate what happens, what can fail, and what the architect must decide.`,
    nodes: [...front.nodes, ...back.nodes],
    edges: [...front.edges, ...bridgeEdges, ...back.edges],
    steps: [
      {
        id: "frontend-composition", number: "01", phase: "CLIENT COMPOSITION", title: front.title,
        nodeIds: frontendNodeIds, edgeIds: frontendEdgeIds,
        whatHappens: front.description, concreteExample: front.example, failureMode: front.failure, decision: front.decision,
        technologyIds: [frontend.id, frontendArchitecture.id],
      },
      {
        id: "api-contract", number: "02", phase: "NETWORK CONTRACT", title: "Cross the public API boundary",
        nodeIds: [...front.exits, back.entry], edgeIds: bridgeEdges.map((item) => item.id),
        whatHappens: `The frontend never talks to ${database.name}. It calls a public HTTPS boundary owned by ${deployment.name}; that boundary authenticates or routes to ${backend.name} without becoming the domain itself.`,
        concreteExample: "The selected UI sends GET /api/catalog?cursor=abc with an access token and correlation ID; the API returns a versioned JSON response or a documented error.",
        failureMode: "No timeout, retry contract, API versioning, or consistent error shape couples clients to implementation details and makes partial failure impossible to diagnose.",
        decision: "Record who owns authentication, CORS, rate limits, request IDs, compatibility, deadlines, and public-to-internal route mapping.",
        technologyIds: [frontend.id, backend.id, deployment.id],
      },
      {
        id: "backend-boundaries", number: "03", phase: "DOMAIN EXECUTION", title: `${backendArchitecture.name}: execute domain behavior`,
        nodeIds: [back.entry, ...back.serviceIds], edgeIds: requestEdgeIds,
        whatHappens: back.description, concreteExample: back.example, failureMode: back.failure, decision: back.decision,
        technologyIds: [backend.id, backendArchitecture.id, deployment.id, compute.id],
      },
      {
        id: "data-ownership", number: "04", phase: "STATE OWNERSHIP", title: `Persist state in ${database.name}`,
        nodeIds: [...back.serviceIds, ...back.storeIds], edgeIds: dataEdgeIds,
        whatHappens: backendArchitecture.id === "microservices" ? `Each service owns a separate logical ${database.name} access boundary. Database-per-service can mean separate servers, databases, or schemas, but never shared credentials and cross-service table writes.` : `${backend.name} uses an official ${database.name} driver to reach the database over its native protocol. Repository and transaction boundaries mirror the selected backend architecture.`,
        concreteExample: backendArchitecture.id === "microservices" ? "Order Service writes Orders data. Catalog changes through Catalog's API or an event; it is never updated with an Order-owned SQL statement." : `The application keeps ${database.name} credentials server-side, uses a bounded pool, and applies one local transaction for the selected use case.`,
        failureMode: "Leaked client credentials, unbounded pools, missing migrations, or ownership defined only by table naming can corrupt data and prevent independent change.",
        decision: "Specify credential owner, schema/migration owner, backup and recovery target, transaction scope, connection limits, encryption, and how other domains obtain data.",
        technologyIds: [backend.id, backendArchitecture.id, database.id],
      },
      {
        id: "runtime-operations", number: "05", phase: "OPERATIONS", title: `Keep ${compute.name} workloads healthy on ${deployment.name}`,
        nodeIds: [back.entry, ...back.serviceIds], edgeIds: back.edges.filter((item) => item.source === back.entry).map((item) => item.id),
        whatHappens: `${deployment.name} places or invokes the ${backend.name} workload on ${compute.name}, sends traffic only to healthy instances, and replaces failed capacity according to the platform's rollout model.`,
        concreteExample: `Run at least two healthy copies where the platform supports replicas; expose readiness separately from liveness; attach logs, metrics, traces, and a release identifier to every request.`,
        failureMode: "A process can be running but unable to serve traffic. Missing readiness, graceful shutdown, resource limits, or rollback criteria turns routine releases into outages.",
        decision: "Define replica/concurrency targets, health semantics, autoscaling signals, resource limits, zones, deployment strategy, observability, and rollback thresholds.",
        technologyIds: [analysis.selected.packaging.id, compute.id, deployment.id],
      },
    ],
  };
}

function deliveryTerms(analysis: StackAnalysis) {
  const { ci, iac, packaging, deployment, compute } = analysis.selected;
  const workflow = ci.id === "github-actions" ? ".github/workflows/release.yml" : ci.id === "gitlab-ci" ? ".gitlab-ci.yml" : "Jenkinsfile";
  const preview = iac.id === "terraform" ? "terraform plan" : iac.id === "cloudformation" ? "CloudFormation change set" : "pulumi preview";
  const apply = iac.id === "terraform" ? "terraform apply" : iac.id === "cloudformation" ? "Execute change set" : "pulumi up";
  const artifact = packaging.id === "docker" ? "Image registry" : "Build output store";
  const artifactExample = packaging.id === "docker" ? "registry.example.com/orders@sha256:7f…" : "immutable provider build output for commit a84d2f";
  const rollout = deployment.id === "kubernetes" ? "Deployment + Service" : deployment.id === "ecs" ? "Task definition + ECS service" : "Vercel deployment";
  const replica = deployment.id === "kubernetes" ? "Pod" : deployment.id === "ecs" ? "ECS task" : "Function instance";
  return { ci, iac, packaging, deployment, compute, workflow, preview, apply, artifact, artifactExample, rollout, replica };
}

function deliveryExample(analysis: StackAnalysis): ArchitectureExample {
  const t = deliveryTerms(analysis);
  const frontendIds = analysis.selected.frontendArchitecture.id === "microfrontends" ? [analysis.selected.frontend.id, ...Object.values(analysis.assignments.frontendApps)] : [analysis.selected.frontend.id];
  const backendIds = analysis.selected.backendArchitecture.id === "microservices" ? Object.values(analysis.assignments.backendServices) : [analysis.selected.backend.id];
  const frontendNames = [...new Set(frontendIds.map((id) => technologiesByCategory.frontend.find((technology) => technology.id === id)?.name).filter(Boolean))];
  const backendNames = [...new Set(backendIds.map((id) => technologiesByCategory.backend.find((technology) => technology.id === id)?.name).filter(Boolean))];
  const frontendArtifacts = analysis.selected.frontendArchitecture.id === "microfrontends" ? 4 : 1;
  const backendArtifacts = analysis.selected.backendArchitecture.id === "microservices" ? 3 : 1;
  const artifactCount = frontendArtifacts + backendArtifacts;
  const toolchainSummary = `${frontendNames.join(" + ")} frontend; ${backendNames.join(" + ")} backend`;
  const nodes = [
    node("repo", "SOURCE", "Application repository", "Git", `Contains application code, tests, ${t.workflow}, and infrastructure definitions.`, 0, 245, "delivery"),
    node("pipeline", "AUTOMATION", "Pipeline trigger", t.ci.name, `A protected push or release starts ${t.workflow} on an isolated runner.`, 250, 245, "delivery"),
    node("validate", "JOB 1", "Validate + lint", t.ci.name, "Rejects malformed configuration, policy violations, lint failures, and type errors before producing artifacts.", 510, 25, "delivery"),
    node("test", "JOB 2", "Test behavior matrix", t.ci.name, `Runs each toolchain plus cross-application API and route contracts: ${toolchainSummary}.`, 510, 245, "delivery"),
    node("build", "JOB 3", `Build ${artifactCount} immutable artifacts`, t.packaging.name, t.packaging.id === "docker" ? `Builds each independently deployable frontend and service with its own runtime dependencies and commit identifier.` : `Produces ${artifactCount} independently deployable framework/provider outputs.`, 510, 465, "delivery"),
    node("plan", "CHANGE PREVIEW", t.preview, t.iac.name, "Refreshes known infrastructure state and previews create, update, replace, or delete actions before execution.", 800, 25, "delivery"),
    node("approval", "PROTECTED GATE", "Production approval", t.ci.name, "Authorized reviewers examine test evidence and infrastructure changes before protected secrets are released.", 1060, 25, "delivery"),
    node("apply", "CONTROL PLANE", t.apply, t.iac.name, `Calls provider APIs to reconcile declared infrastructure for ${t.deployment.name} and ${t.compute.name}.`, 1320, 25, "delivery"),
    node("registry", "IMMUTABLE INPUT", `${t.artifact} set`, t.packaging.name, `Stores ${artifactCount} revision-linked outputs so every application and service can roll forward or back independently.`, 800, 465, "delivery"),
    node("rollout", "ORCHESTRATOR", t.rollout, t.deployment.name, "Creates a new revision, replaces capacity gradually, and stops when health criteria fail.", 1060, 330, "delivery"),
    node("replica-a", "HEALTHY CAPACITY", `${t.replica} A`, t.compute.name, "Runs or serves the new revision and receives traffic only after its health signal passes.", 1370, 245, "compute"),
    node("replica-b", "HEALTHY CAPACITY", `${t.replica} B`, t.compute.name, "A second independent capacity unit keeps serving while another starts, drains, or fails.", 1370, 445, "compute"),
  ];
  const edges = [
    edge("repo-pipeline", "repo", "pipeline", "push / release", "The CI system checks out the immutable commit that triggered the workflow.", "delivery"),
    edge("pipeline-validate", "pipeline", "validate", "job", "Configuration and static checks fail fast before costly work.", "delivery"),
    edge("pipeline-test", "pipeline", "test", "job", "Tests run in a clean runner with explicit dependency and service versions.", "delivery"),
    edge("pipeline-build", "pipeline", "build", "job", "Build output is tied to the same tested source revision.", "delivery"),
    edge("validate-plan", "validate", "plan", "validated IaC", `Only validated infrastructure definitions reach ${t.preview}.`, "delivery"),
    edge("plan-approval", "plan", "approval", "review diff", "Reviewers see the proposed infrastructure actions before execution.", "delivery"),
    edge("approval-apply", "approval", "apply", "OIDC / secret", "The protected environment grants short-lived production credentials only after the gate passes.", "delivery"),
    edge("build-registry", "build", "registry", t.packaging.id === "docker" ? "push digest" : "publish output", "The artifact is published once and identified immutably.", "artifact"),
    edge("registry-rollout", "registry", "rollout", "deploy revision", "The orchestrator receives the exact artifact reference approved by the pipeline.", "artifact"),
    edge("apply-rollout", "apply", "rollout", "desired infrastructure", "Infrastructure changes establish the service, policies, networking, and rollout configuration.", "delivery"),
    edge("rollout-a", "rollout", "replica-a", "start + health", "The new capacity must become ready before it receives production traffic.", "delivery"),
    edge("rollout-b", "rollout", "replica-b", "replace gradually", "Healthy capacity is maintained while old capacity drains and new capacity starts.", "delivery"),
  ];

  return {
    title: `${t.ci.name} → ${t.deployment.name} release`,
    subtitle: `The delivery path separates evidence, infrastructure change, immutable packaging, rollout, and runtime health. It is not a single arrow labelled “deploy.”`,
    nodes,
    edges,
    steps: [
      {
        id: "pipeline-evidence", number: "01", phase: "CONTINUOUS INTEGRATION", title: `Prove the commit in ${t.ci.name}`,
        nodeIds: ["repo", "pipeline", "validate", "test", "build"], edgeIds: ["repo-pipeline", "pipeline-validate", "pipeline-test", "pipeline-build"],
        whatHappens: `${t.workflow} checks out one commit and fans out into the required ${frontendNames.join(", ")} and ${backendNames.join(", ")} toolchains. Contract checks prove framework-neutral routes and APIs before ${artifactCount} deployables are accepted.`,
        concreteExample: `Commit a84d2f triggers ${t.workflow}; each framework runs its own lint, type, unit, and build command, while route/API contract tests prove that independently released applications still compose.`,
        failureMode: "Building again during deployment or allowing jobs to test different source/dependency versions breaks traceability between evidence and production.",
        decision: "Define required checks, runner isolation, dependency pinning, cache trust, test scope, retention, and the exact event allowed to create a release.",
        technologyIds: [t.ci.id, analysis.selected.frontend.id, analysis.selected.backend.id],
      },
      {
        id: "infrastructure-change", number: "02", phase: "INFRASTRUCTURE AS CODE", title: `Preview and approve ${t.iac.name} changes`,
        nodeIds: ["validate", "plan", "approval", "apply"], edgeIds: ["validate-plan", "plan-approval", "approval-apply"],
        whatHappens: `${t.preview} compares declared configuration with known provider state. A protected environment gate authorizes ${t.apply} to call cloud control-plane APIs.`,
        concreteExample: "The preview says: add one service, replace a task definition, update two IAM statements, delete nothing. A platform owner approves that exact change.",
        failureMode: "Applying without a reviewed preview, sharing long-lived keys, or running concurrent state changes can destroy resources or make declared and real infrastructure diverge.",
        decision: "Choose state storage/locking, drift detection, policy checks, approval owners, short-lived identity, environment separation, and recovery for a partial apply.",
        technologyIds: [t.iac.id, t.ci.id],
      },
      {
        id: "artifact-supply-chain", number: "03", phase: "SOFTWARE SUPPLY CHAIN", title: `Publish ${t.packaging.name} once`,
        nodeIds: ["build", "registry"], edgeIds: ["build-registry"],
        whatHappens: t.packaging.id === "docker" ? `Each independently deployed unit creates runtime content suited to its framework. CI publishes ${artifactCount} immutable images or outputs; production never assumes all services share one base runtime.` : `CI produces ${artifactCount} provider-compatible outputs and publishes independently addressable revisions.`,
        concreteExample: `Publish an artifact manifest for commit a84d2f that maps every app and service to its own digest or output. Attach dependency metadata, scan results, and provenance to each identifier.`,
        failureMode: "Deploying :latest, including secrets in layers, running as root, or rebuilding after approval makes rollback and provenance unreliable.",
        decision: "Define base-image/update policy, build isolation, signing/provenance, vulnerability thresholds, registry retention, architecture targets, and immutable release naming.",
        technologyIds: [t.packaging.id, t.ci.id],
      },
      {
        id: "controlled-rollout", number: "04", phase: "ORCHESTRATION", title: `Roll out through ${t.deployment.name}`,
        nodeIds: ["apply", "registry", "rollout"], edgeIds: ["registry-rollout", "apply-rollout"],
        whatHappens: `${t.rollout} references the approved artifact and desired infrastructure. ${t.deployment.name} creates a new revision and replaces capacity according to rollout limits.`,
        concreteExample: "Start one new revision, wait for readiness, shift traffic, drain one old revision, and stop or roll back if error rate or latency exceeds the release threshold.",
        failureMode: "Replacing all capacity at once, mutable configuration, or a readiness check that only tests process existence can route users to a broken release.",
        decision: "Specify rolling/canary/blue-green strategy, surge and unavailable limits, configuration versioning, database migration ordering, rollback trigger, and drain time.",
        technologyIds: [t.deployment.id, t.iac.id, t.packaging.id],
      },
      {
        id: "healthy-capacity", number: "05", phase: "RUNTIME CONFIDENCE", title: `Prove healthy ${t.compute.name} capacity`,
        nodeIds: ["rollout", "replica-a", "replica-b"], edgeIds: ["rollout-a", "rollout-b"],
        whatHappens: `${t.deployment.name} keeps the desired healthy capacity on ${t.compute.name}. Traffic reaches a unit only after readiness; failed units are removed and replaced.`,
        concreteExample: `${t.replica} A passes dependency-aware readiness before receiving traffic while ${t.replica} B remains available. Logs, metrics, and traces carry release a84d2f.`,
        failureMode: "Single-zone or single-replica capacity, no resource limits, and health checks that ignore dependencies allow failures to become outages or restart loops.",
        decision: "Set capacity/concurrency, placement, CPU/memory limits, health checks, autoscaling signals, observability, SLOs, and a tested rollback/runbook owner.",
        technologyIds: [t.compute.id, t.deployment.id],
      },
    ],
  };
}

export function buildArchitectureExample(analysis: StackAnalysis, lens: DiagramLens): ArchitectureExample {
  return lens === "runtime" ? runtimeExample(analysis) : deliveryExample(analysis);
}
