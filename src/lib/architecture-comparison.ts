import {
  categoryLabels,
  categoryOrder,
  technologiesByCategory,
  type StackSelection,
  type TechnologyCategory,
} from "@/content/architecture";

export type Rating = "Low" | "Medium" | "High";
export type Confidence = "Low" | "Medium" | "High";
export type ArchitectureVariantId = "modular-monolith" | "microservices" | "serverless";

export type ProjectContext = {
  productType: string;
  engineers: number;
  teams: number;
  deliveryMonths: number;
  traffic: Rating;
  trafficVariability: Rating;
  costSensitivity: Rating;
  platformMaturity: Rating;
  cloudProvider: "AWS" | "Azure" | "GCP" | "Other";
  compliance: "Standard" | "Regulated" | "Strict";
  dataConsistency: "Eventual" | "Mixed" | "Strong";
  availabilityTarget: string;
  systemLifetime: string;
  teamExperience: Rating;
  lockInTolerance: Rating;
  operationalComplexityTolerance: Rating;
};

export type ArchitectureVariant = {
  id: ArchitectureVariantId;
  name: string;
  summary: string;
  consequences: string[];
};

export type ComparisonDimensionId =
  | "delivery-speed"
  | "operational-simplicity"
  | "cost-efficiency"
  | "independent-scaling"
  | "team-autonomy"
  | "resilience";

export type ComparisonDimension = {
  id: ComparisonDimensionId;
  label: string;
  weight: number;
  description: string;
};

export type ComparisonAssessment = {
  dimension: ComparisonDimension;
  rating: Rating;
  explanation: string;
  assumptions: string[];
  confidence: Confidence;
};

export type ComparisonResult = {
  variant: ArchitectureVariant;
  assessments: ComparisonAssessment[];
  weightedScore: number;
};

export type Recommendation = {
  recommended: ArchitectureVariant;
  result: ComparisonResult;
  alternatives: ComparisonResult[];
  reasons: string[];
  whatCouldChange: string[];
  confidence: Confidence;
};

export type StackDifference = {
  category: TechnologyCategory;
  label: string;
  beforeId: string;
  before: string;
  afterId: string;
  after: string;
};

export type FailureMode = {
  id: string;
  variant: ArchitectureVariantId;
  title: string;
  likelihood: Rating;
  impact: Rating;
  detection: string;
  mitigation: string;
};

export type FailureModeComparison = {
  variants: ArchitectureVariantId[];
  failureModes: FailureMode[];
};

export type MigrationStep = {
  order: number;
  title: string;
  outcome: string;
  exitCriteria: string;
};

export type ArchitectureDecisionRecord = {
  title: string;
  status: "Proposed" | "Accepted" | "Superseded";
  context: ProjectContext;
  recommendation: Recommendation;
  stackDifferences?: StackDifference[];
  migration: MigrationStep[];
};

export const defaultProjectContext: ProjectContext = {
  productType: "SaaS application",
  engineers: 5,
  teams: 1,
  deliveryMonths: 3,
  traffic: "Medium",
  trafficVariability: "Medium",
  costSensitivity: "High",
  platformMaturity: "Low",
  cloudProvider: "AWS",
  compliance: "Standard",
  dataConsistency: "Strong",
  availabilityTarget: "99.9%",
  systemLifetime: "3-5 years",
  teamExperience: "Medium",
  lockInTolerance: "Medium",
  operationalComplexityTolerance: "Low",
};

export const architectureVariants: ArchitectureVariant[] = [
  {
    id: "modular-monolith",
    name: "Modular monolith",
    summary: "One deployable application with enforced domain module boundaries.",
    consequences: ["Simple local transactions and operations", "Modules share a release and scaling boundary", "Boundaries need code-level enforcement"],
  },
  {
    id: "microservices",
    name: "Microservices",
    summary: "Independently deployed, domain-aligned services with explicit network and data contracts.",
    consequences: ["Independent deployment and scaling", "Distributed failures and consistency", "More pipelines, telemetry, security, and infrastructure ownership"],
  },
  {
    id: "serverless",
    name: "Serverless functions",
    summary: "Event-triggered functions operated and scaled by a cloud provider.",
    consequences: ["Scale-to-zero and managed runtime operations", "Provider coupling and invocation constraints", "Retries, idempotency, cold starts, and connection limits become design concerns"],
  },
];

export const comparisonDimensions: ComparisonDimension[] = [
  { id: "delivery-speed", label: "Delivery speed", weight: 3, description: "Ability to deliver useful software within the stated horizon." },
  { id: "operational-simplicity", label: "Operational simplicity", weight: 3, description: "Fit with the team's ability to run and diagnose the system." },
  { id: "cost-efficiency", label: "Cost efficiency", weight: 2, description: "Efficient use of infrastructure and engineering effort." },
  { id: "independent-scaling", label: "Independent scaling", weight: 1, description: "Ability to scale workloads separately." },
  { id: "team-autonomy", label: "Team autonomy", weight: 1, description: "Ability for teams to release without coordination." },
  { id: "resilience", label: "Resilience", weight: 2, description: "Ability to contain and recover from failures." },
];

const baseScores: Record<ArchitectureVariantId, Record<ComparisonDimensionId, number>> = {
  "modular-monolith": { "delivery-speed": 3, "operational-simplicity": 3, "cost-efficiency": 3, "independent-scaling": 1, "team-autonomy": 1, resilience: 2 },
  microservices: { "delivery-speed": 1, "operational-simplicity": 1, "cost-efficiency": 1, "independent-scaling": 3, "team-autonomy": 3, resilience: 2 },
  serverless: { "delivery-speed": 2, "operational-simplicity": 2, "cost-efficiency": 2, "independent-scaling": 3, "team-autonomy": 2, resilience: 2 },
};

const explanations: Record<ArchitectureVariantId, Record<ComparisonDimensionId, string>> = {
  "modular-monolith": {
    "delivery-speed": "One deployable and local calls minimize coordination during initial delivery.",
    "operational-simplicity": "A single runtime, release, and primary data boundary reduce operational surface area.",
    "cost-efficiency": "Shared capacity and fewer control-plane components limit both cloud and engineering overhead.",
    "independent-scaling": "The application normally scales as one unit, even when only one module is busy.",
    "team-autonomy": "Modules can have owners, but production releases share one deployment boundary.",
    resilience: "Local calls avoid network failures, but a process-level fault can affect every module.",
  },
  microservices: {
    "delivery-speed": "Service boundaries add contract, deployment, data, and observability work before features ship.",
    "operational-simplicity": "Every service adds a runtime, release path, network boundary, and partial-failure mode.",
    "cost-efficiency": "Baseline capacity and platform work are repeated across independently operated services.",
    "independent-scaling": "Hot domains can scale without scaling the rest of the system.",
    "team-autonomy": "Domain teams can own releases and technology choices behind stable contracts.",
    resilience: "Failures can be isolated, but only when deadlines, retries, fallbacks, and observability are mature.",
  },
  serverless: {
    "delivery-speed": "Managed runtimes remove server setup, while event and provider integration still require design work.",
    "operational-simplicity": "The provider manages hosts, but functions multiply logs, permissions, configuration, and traces.",
    "cost-efficiency": "Usage-based billing is efficient for bursty demand but can become expensive at sustained load.",
    "independent-scaling": "Handlers scale independently in response to events, subject to quotas and downstream limits.",
    "team-autonomy": "Functions can release separately, though shared events and provider resources require governance.",
    resilience: "Managed availability helps, while retries and duplicate delivery demand idempotent handlers.",
  },
};

const failureModes: FailureMode[] = [
  { id: "module-erosion", variant: "modular-monolith", title: "Module boundaries erode", likelihood: "Medium", impact: "High", detection: "Dependency checks reveal circular imports or cross-module table access.", mitigation: "Enforce module APIs, ownership, and architecture tests." },
  { id: "shared-blast-radius", variant: "modular-monolith", title: "One release affects the whole application", likelihood: "Medium", impact: "Medium", detection: "Release health degrades across unrelated modules.", mitigation: "Use incremental rollouts, health checks, and fast rollback." },
  { id: "distributed-monolith", variant: "microservices", title: "Services form a distributed monolith", likelihood: "High", impact: "High", detection: "Releases require coordinated service changes or long synchronous call chains.", mitigation: "Own data per service and evolve backward-compatible contracts." },
  { id: "partial-failure", variant: "microservices", title: "Network partial failure cascades", likelihood: "High", impact: "High", detection: "Timeout, retry, and dependency saturation metrics rise together.", mitigation: "Set deadlines, bounded retries, circuit breaking, and bulkheads." },
  { id: "duplicate-events", variant: "serverless", title: "Retried events duplicate effects", likelihood: "High", impact: "High", detection: "The same event identifier produces repeated writes or messages.", mitigation: "Use idempotency keys and durable deduplication." },
  { id: "downstream-exhaustion", variant: "serverless", title: "Concurrency exhausts downstream capacity", likelihood: "Medium", impact: "High", detection: "Database connections or API quotas saturate as invocations rise.", mitigation: "Cap concurrency, pool or proxy connections, and apply backpressure." },
];

function clamp(score: number): number {
  return Math.max(1, Math.min(3, score));
}

function rating(score: number): Rating {
  return score >= 2.5 ? "High" : score >= 1.5 ? "Medium" : "Low";
}

function contextualScore(variant: ArchitectureVariantId, dimension: ComparisonDimensionId, context: ProjectContext): number {
  let score = baseScores[variant][dimension];
  if (context.teams === 1 && dimension === "team-autonomy") score += variant === "modular-monolith" ? 1 : -1;
  if (context.teams >= 3) {
    if (dimension === "team-autonomy") score += variant === "microservices" ? 2 : variant === "modular-monolith" ? -1 : 0.5;
    if (dimension === "delivery-speed") score += variant === "microservices" ? 0.5 : variant === "modular-monolith" ? -0.5 : 0;
  }
  if (context.engineers <= 6 && (dimension === "delivery-speed" || dimension === "operational-simplicity")) score += variant === "modular-monolith" ? 0.5 : variant === "microservices" ? -0.5 : 0;
  if (context.deliveryMonths <= 3 && dimension === "delivery-speed") score += variant === "modular-monolith" ? 0.5 : variant === "microservices" ? -0.5 : 0;
  if (context.platformMaturity === "Low" && dimension === "operational-simplicity") score += variant === "modular-monolith" ? 0.5 : -0.5;
  if (context.platformMaturity === "High" && dimension === "operational-simplicity") score += variant === "microservices" ? 2 : variant === "serverless" ? 0.5 : -0.5;
  if (context.operationalComplexityTolerance === "High" && dimension === "operational-simplicity") score += variant === "microservices" ? 1 : variant === "modular-monolith" ? -0.5 : 0;
  if (context.teamExperience === "High" && variant === "microservices" && dimension === "delivery-speed") score += 0.5;
  if (context.costSensitivity === "High" && dimension === "cost-efficiency") score += variant === "modular-monolith" ? 0.5 : variant === "microservices" ? -0.5 : 0;
  if (context.costSensitivity === "Low" && dimension === "cost-efficiency") score += variant === "microservices" ? 1 : 0;
  if (context.traffic === "High" && dimension === "independent-scaling") score += variant === "modular-monolith" ? -1 : 1;
  if (context.trafficVariability === "High") {
    if (dimension === "independent-scaling") score += variant === "serverless" ? 1 : 0;
    if (dimension === "cost-efficiency") score += variant === "serverless" ? 1 : 0;
  }
  if (context.dataConsistency === "Strong" && dimension === "resilience") score += variant === "modular-monolith" ? 0.5 : variant === "microservices" ? -0.5 : 0;
  if (context.lockInTolerance === "Low" && variant === "serverless" && dimension === "cost-efficiency") score -= 1;
  if (context.cloudProvider === "AWS" && variant === "serverless" && dimension === "operational-simplicity") score += 0.25;
  return clamp(score);
}

export function assessArchitecture(variantId: ArchitectureVariantId, context: ProjectContext = defaultProjectContext): ComparisonResult {
  const variant = architectureVariants.find((item) => item.id === variantId);
  if (!variant) throw new Error(`Unknown architecture variant: ${variantId}`);
  const assumptions = [`${context.engineers} engineers in ${context.teams} team${context.teams === 1 ? "" : "s"}`, `${context.deliveryMonths}-month delivery horizon`, `${context.traffic.toLowerCase()} traffic on ${context.cloudProvider}`];
  const assessments = comparisonDimensions.map((dimension): ComparisonAssessment => {
    const score = contextualScore(variantId, dimension.id, context);
    return {
      dimension,
      rating: rating(score),
      explanation: explanations[variantId][dimension.id],
      assumptions,
      confidence: context.engineers > 0 && context.deliveryMonths > 0 ? "High" : "Low",
    };
  });
  const weight = comparisonDimensions.reduce((total, dimension) => total + dimension.weight, 0);
  const weightedScore = comparisonDimensions.reduce((total, dimension) => total + contextualScore(variantId, dimension.id, context) * dimension.weight, 0) / weight;
  return { variant, assessments, weightedScore };
}

export function recommendArchitecture(context: ProjectContext = defaultProjectContext): Recommendation {
  const ranked = architectureVariants
    .map((variant) => assessArchitecture(variant.id, context))
    .sort((left, right) => right.weightedScore - left.weightedScore || left.variant.id.localeCompare(right.variant.id));
  const result = ranked[0];
  const strengths = result.assessments.filter((assessment) => assessment.rating === "High").slice(0, 3);
  const reasons = strengths.map((assessment) => `${assessment.dimension.label}: ${assessment.explanation}`);
  const changes: Record<ArchitectureVariantId, string[]> = {
    "modular-monolith": ["Several autonomous teams need independent release ownership.", "Measured workload hotspots require separate scaling.", "The platform reaches high maturity in distributed tracing, service delivery, and incident response."],
    microservices: ["Teams consolidate into one release train.", "Operational ownership or platform maturity decreases.", "The delivery horizon becomes more important than independent scaling and releases."],
    serverless: ["Work becomes long-running, stateful, or consistently high-throughput.", "Provider portability becomes a primary constraint.", "Invocation cost, latency, or downstream connection limits fail measured targets."],
  };
  return {
    recommended: result.variant,
    result,
    alternatives: ranked.slice(1),
    reasons,
    whatCouldChange: changes[result.variant.id],
    confidence: ranked[0].weightedScore - ranked[1].weightedScore >= 0.35 ? "High" : "Medium",
  };
}

function technologyName(category: TechnologyCategory, id: string): string {
  return technologiesByCategory[category].find((technology) => technology.id === id)?.name ?? id;
}

export function compareStackSelections(before: StackSelection, after: StackSelection): StackDifference[] {
  return categoryOrder.flatMap((category) => before[category] === after[category] ? [] : [{
    category,
    label: categoryLabels[category],
    beforeId: before[category],
    before: technologyName(category, before[category]),
    afterId: after[category],
    after: technologyName(category, after[category]),
  }]);
}

export function compareFailureModes(...variants: ArchitectureVariantId[]): FailureModeComparison {
  const selected = variants.length > 0 ? [...new Set(variants)] : architectureVariants.map((variant) => variant.id);
  return { variants: selected, failureModes: failureModes.filter((mode) => selected.includes(mode.variant)) };
}

export function migrationStepsFor(from: ArchitectureVariantId, to: ArchitectureVariantId): MigrationStep[] {
  if (from === to) return [{ order: 1, title: "Validate the current boundaries", outcome: `Retain ${to} with explicit ownership and operating constraints.`, exitCriteria: "Architecture tests and operational targets pass." }];
  const shared: MigrationStep[] = [
    { order: 1, title: "Measure and map boundaries", outcome: "Domain ownership, dependencies, traffic, latency, and failure targets are documented.", exitCriteria: "A measured reason exists for changing the deployment boundary." },
    { order: 2, title: "Enforce contracts before moving code", outcome: "The target boundary has an explicit API or event contract and owns its data access.", exitCriteria: "Consumers use the contract rather than implementation details or shared writes." },
  ];
  if (to === "modular-monolith") return [...shared, { order: 3, title: "Consolidate the release boundary", outcome: "Services or functions become modules in one deployable without losing ownership boundaries.", exitCriteria: "One pipeline can deploy and roll back the application safely." }];
  return [...shared, { order: 3, title: "Extract one low-risk boundary", outcome: `One workload runs as an independently observable ${to === "microservices" ? "service" : "function"}.`, exitCriteria: "Load, failure, rollback, cost, and on-call behavior meet targets." }, { order: 4, title: "Review before repeating", outcome: "Evidence determines whether another extraction is justified.", exitCriteria: "The decision record contains measured benefits and new operating costs." }];
}

export function generateArchitectureAdr(record: ArchitectureDecisionRecord): string {
  const { recommendation } = record;
  const assumptions = recommendation.result.assessments[0]?.assumptions ?? [];
  const alternatives = recommendation.alternatives.map((result) => `- **${result.variant.name}:** ${result.variant.consequences.join("; ")}.`);
  const differences = record.stackDifferences?.map((difference) => `- ${difference.label}: ${difference.before} -> ${difference.after}`) ?? [];
  return [
    `# ${record.title}`,
    "",
    `Status: ${record.status}`,
    "",
    "## Context",
    "",
    ...assumptions.map((assumption) => `- ${assumption}`),
    `- ${record.context.costSensitivity.toLowerCase()} cost sensitivity and ${record.context.platformMaturity.toLowerCase()} platform maturity`,
    "",
    "## Decision",
    "",
    `Adopt **${recommendation.recommended.name}**.`,
    ...recommendation.reasons.map((reason) => `- ${reason}`),
    "",
    "## Consequences",
    "",
    ...recommendation.recommended.consequences.map((consequence) => `- ${consequence}`),
    "",
    "## Alternatives considered",
    "",
    ...alternatives,
    ...(differences.length ? ["", "## Stack changes", "", ...differences] : []),
    "",
    "## Migration",
    "",
    ...record.migration.map((step) => `${step.order}. **${step.title}:** ${step.outcome} Exit when: ${step.exitCriteria}`),
    "",
    "## What could change this decision",
    "",
    ...recommendation.whatCouldChange.map((condition) => `- ${condition}`),
    "",
  ].join("\n");
}
