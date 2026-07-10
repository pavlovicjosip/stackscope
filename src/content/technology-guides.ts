import { technologies, type Technology, type TechnologyCategory } from "./architecture";

export type TechnologyGuide = {
  meaning: string;
  concreteExample: string;
  owns: string[];
  communicates: string[];
  watchFor: string[];
};

const guides = {
  react: ["A component library for composing interactive browser interfaces; it does not prescribe routing, data loading, or deployment.", "An OrdersPage renders OrderTable and calls a typed API client after a user filters results.", ["component boundaries", "client state and effects"], ["browser events", "HTTPS through an API client"], ["effect races", "large client bundles"]],
  next: ["A React framework that can render routes at build time, request time, or in the browser and can host UI-focused server endpoints.", "An order route renders HTML on the server, then hydrates controls; its BFF endpoint shapes order and customer data.", ["route rendering strategy", "server/client component boundary"], ["HTTPS", "React Server Components", "JSON"], ["server/client data leaks", "cache semantics"]],
  vue: ["A progressive component framework for browser UIs that can be paired with routers, state tools, or a meta-framework.", "A Vue catalog SPA renders product components and calls GET /api/catalog from a centralized client.", ["component tree", "reactive UI state"], ["browser events", "HTTPS + JSON"], ["reactivity misuse", "bundle growth"]],
  angular: ["A full application framework with components, dependency injection, routing, forms, HTTP clients, and optional server rendering.", "An Angular checkout application lazy-loads its route, uses HttpClient, and renders order status from a typed service.", ["application modules/routes", "dependency and UI boundaries"], ["HTTPS through HttpClient", "optional SSR/hydration"], ["eager bundles", "mixing domain logic into components"]],
  spa: ["A client-rendered application that replaces views after one initial document load.", "The browser downloads app.js once; /orders navigation is handled locally and data comes from GET /api/orders.", ["client navigation", "loading/error UI"], ["History API", "HTTPS APIs"], ["slow first load", "client-only security assumptions"]],
  "ssr-bff": ["A frontend server renders initial HTML and exposes a UI-specific backend boundary that aggregates domain APIs.", "GET /orders/42 asks the BFF for one page model, streams HTML, then hydrates interactive actions.", ["page rendering", "UI-shaped aggregation"], ["HTML streaming", "server-to-service HTTP"], ["duplicated domain rules", "BFF becoming a general API"]],
  microfrontends: ["Several independently deployed frontend applications form one product through shared routing and interface contracts.", "A default shell owns navigation while Catalog serves /catalog/*, Account /account/*, and Checkout /checkout/*.", ["route/team ownership", "shared UX contracts"], ["shared-domain path routing", "versioned events/interfaces"], ["shared global state", "coupled releases"]],
  express: ["A minimal Node.js HTTP framework whose application supplies validation, persistence, security, and operational conventions.", "An /orders router validates JSON, invokes an Order use case, and uses a PostgreSQL driver behind a repository.", ["HTTP routing/middleware", "request lifecycle"], ["HTTP/JSON", "Node database drivers"], ["blocking work", "unstructured middleware"]],
  fastapi: ["A Python ASGI API framework using type hints for validation and OpenAPI descriptions.", "POST /orders validates a Pydantic model, calls an async use case, and returns a documented 201 response.", ["HTTP contract", "dependency/request lifecycle"], ["ASGI HTTP", "OpenAPI", "Python DB drivers"], ["blocking calls in async routes", "worker sizing"]],
  spring: ["A JVM application framework that supplies web, dependency injection, data, configuration, and production facilities.", "An OrderController calls an OrderService inside a transaction and persists through a JDBC repository.", ["application context", "transaction/service boundaries"], ["HTTP/JSON", "JDBC", "messaging"], ["hidden auto-configuration", "slow or oversized startup"]],
  "modular-monolith": ["One deployable process containing explicit domain modules with enforced internal dependency rules.", "Identity, Catalog, and Orders ship together but expose module APIs and own separate repository interfaces.", ["module boundaries", "one release and transaction boundary"], ["in-process interfaces", "local transactions"], ["cross-module table access", "circular dependencies"]],
  microservices: ["Independently deployable, domain-aligned services that communicate across fallible network boundaries.", "Identity, Catalog, and Orders each expose an API, deploy separately, and own their database credentials.", ["service/API/data ownership", "independent operations"], ["HTTP/gRPC", "events", "service discovery"], ["distributed monolith", "shared database writes"]],
  serverless: ["Purpose-specific handlers invoked by managed event sources in provider-controlled execution environments.", "POST /orders invokes CreateOrder; a schedule separately invokes ExpireReservations without a permanent server.", ["handler contract", "idempotency and timeout"], ["HTTP/event payloads", "provider APIs"], ["cold starts", "connection storms"]],
  postgres: ["A relational database server providing SQL, constraints, indexes, transactions, and a native client protocol.", "Orders and order_items are changed in one transaction; an index serves recent-order queries.", ["relational integrity", "transactions and query plans"], ["PostgreSQL wire protocol", "SQL over TLS"], ["unbounded connections", "missing migration/recovery tests"]],
  mysql: ["A relational database server reached through official connectors and organized around schemas, indexes, and transactions.", "An application uses Connector/J or Connector/Python to execute a parameterized order transaction.", ["relational state", "transaction durability"], ["MySQL protocol", "SQL over TLS"], ["connection exhaustion", "unsafe schema changes"]],
  mongodb: ["A document database that stores BSON documents and is accessed through language-specific drivers.", "A catalog collection embeds product attributes while the driver uses a protected connection string and bounded pool.", ["document model", "indexes and replication policy"], ["MongoDB wire protocol", "BSON over TLS"], ["unbounded documents", "missing index/query discipline"]],
  "github-actions": ["Repository-event automation defined as YAML workflows containing jobs and steps on managed or self-hosted runners.", "release.yml runs lint, test, image build, Terraform plan, protected approval, and deployment using OIDC.", ["workflow evidence", "environment gates"], ["Git events", "artifacts", "OIDC"], ["overprivileged tokens", "untrusted action pinning"]],
  "gitlab-ci": ["GitLab pipelines defined by stages and jobs in .gitlab-ci.yml and executed by registered runners.", "A merge pipeline tests the commit; a protected deploy job consumes its image digest and environment credentials.", ["pipeline stages", "runner and environment policy"], ["Git events", "artifacts", "OIDC"], ["shared runner trust", "mutable job dependencies"]],
  jenkins: ["A self-managed automation controller that schedules Pipeline stages onto agents and extends behavior through plugins.", "A Jenkinsfile tests on an ephemeral agent, builds an image, archives evidence, and requires an input gate before deploy.", ["controller/agent operations", "Pipeline and credentials"], ["SCM webhooks", "artifacts", "plugin APIs"], ["plugin/controller drift", "persistent agent contamination"]],
  terraform: ["Declarative, provider-driven infrastructure as code with a write, plan, apply workflow and recorded state.", "terraform plan previews an ECS service and IAM change; an approved apply reconciles them through AWS APIs.", ["desired infrastructure", "state and provider versions"], ["HCL", "provider APIs", "state backend"], ["state conflicts", "unreviewed replacement/deletion"]],
  cloudformation: ["AWS-native declarative templates reconciled as stacks through the AWS control plane.", "A change set previews a new ECS task definition and listener rule before the stack update executes.", ["AWS stack resources", "template/change-set lifecycle"], ["YAML/JSON", "AWS APIs"], ["stack coupling", "replacement and rollback behavior"]],
  pulumi: ["Infrastructure as code expressed in general-purpose languages or YAML and evaluated into provider resource operations with state.", "pulumi preview shows an ECS service diff; pulumi up applies the reviewed program using an AWS provider.", ["infrastructure program", "state and provider configuration"], ["language runtime", "provider APIs"], ["non-deterministic program logic", "state/secret handling"]],
  docker: ["A build and image format that packages application filesystem layers, metadata, command, and dependencies for a container runtime.", "CI builds the Dockerfile, tags commit a84d2f, pushes it, and deploys the immutable sha256 digest.", ["runtime artifact", "build instructions and metadata"], ["OCI image", "registry API"], ["secrets in layers", "mutable tags/root execution"]],
  source: ["Source code or framework build output handed to a platform that performs or understands the final runtime build.", "A Vercel deployment consumes framework output for commit a84d2f instead of a team-built container image.", ["source/build-output contract", "runtime version declaration"], ["Git", "provider build API"], ["provider lock-in", "non-reproducible remote builds"]],
  fargate: ["Managed serverless compute capacity for ECS tasks or EKS Pods; the team still defines images, networking, IAM, resources, and health.", "ECS maintains two Fargate tasks, each with its own ENI, CPU/memory allocation, role, and load-balancer health check.", ["task/pod resources", "network and IAM boundary"], ["container image", "VPC networking", "AWS APIs"], ["wrong CPU/memory sizing", "egress and cold-start latency"]],
  ec2: ["Virtual-machine capacity where the team controls operating system, agents, patching, scaling, and workload placement.", "An Auto Scaling group maintains three instances across zones and drains an instance before replacing its AMI.", ["OS and instance lifecycle", "capacity and patching"], ["VPC networking", "instance metadata", "autoscaling"], ["configuration drift", "unpatched or single-zone fleets"]],
  "vercel-functions": ["Managed request or event functions that scale with demand using supported provider runtimes.", "An API route becomes a function that reads a secret at runtime, queries through a pooled data service, and returns within its limit.", ["function code and limits", "region/runtime choice"], ["HTTPS", "events", "provider runtime"], ["long work", "database connection pressure"]],
  kubernetes: ["A container orchestration API where controllers reconcile workloads and Services provide stable discovery and traffic access.", "A Deployment rolls three Pods while a Service targets only ready Pods by label and DNS name.", ["desired workload state", "service discovery and rollout"], ["OCI images", "Service DNS", "HTTP/TCP"], ["missing requests/limits", "unsafe probes and policy"]],
  vercel: ["A managed build, CDN, frontend, and function deployment platform with framework-aware revisions and global routing.", "A Git commit creates an immutable preview; production promotion sends static assets to the CDN and routes APIs to functions.", ["deployment revision", "domain/build/runtime configuration"], ["Git", "HTTPS/CDN", "functions"], ["platform runtime limits", "frontend/backend boundary confusion"]],
  ecs: ["An AWS container orchestrator that runs task definitions as services and integrates desired count, rollout, networking, and load balancing.", "An ECS service rolls from task definition 41 to 42, keeps two healthy Fargate tasks, and registers them in an ALB target group.", ["task definition/service", "desired count and rollout"], ["OCI registry", "AWS APIs", "HTTP/TCP"], ["bad health grace period", "deployment capacity deadlock"]],
} satisfies Record<string, readonly [string, string, readonly string[], readonly string[], readonly string[]]>;

export const technologyGuides: Record<string, TechnologyGuide> = Object.fromEntries(
  Object.entries(guides).map(([id, [meaning, concreteExample, owns, communicates, watchFor]]) => [id, { meaning, concreteExample, owns: [...owns], communicates: [...communicates], watchFor: [...watchFor] }]),
);

export function guideForTechnology(technology: Technology): TechnologyGuide {
  return technologyGuides[technology.id];
}

export function selectedGuides(selected: Record<TechnologyCategory, Technology>) {
  return Object.values(selected).map((technology) => ({ technology, guide: guideForTechnology(technology) }));
}

export function validateTechnologyGuides(): string[] {
  const catalogIds = new Set(technologies.map((technology) => technology.id));
  const errors: string[] = [];
  for (const technology of technologies) {
    const guide = technologyGuides[technology.id];
    if (!guide) errors.push(`${technology.id}: missing technology guide`);
    else if (!guide.meaning || !guide.concreteExample || guide.owns.length < 2 || guide.communicates.length < 2 || guide.watchFor.length < 2) errors.push(`${technology.id}: incomplete technology guide`);
  }
  for (const id of Object.keys(technologyGuides)) if (!catalogIds.has(id)) errors.push(`${id}: guide has no catalog technology`);
  return errors;
}

const guideErrors = validateTechnologyGuides();
if (guideErrors.length) throw new Error(`Technology guide validation failed:\n${guideErrors.join("\n")}`);
