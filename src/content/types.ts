export type NodeKind =
  | "client"
  | "network"
  | "service"
  | "database"
  | "cache"
  | "queue"
  | "infrastructure"
  | "observability";

export type FlowKind =
  | "request"
  | "response"
  | "query"
  | "event"
  | "artifact"
  | "telemetry";

export type DetailDepth = "plain" | "engineering" | "production";

export type SystemNode = {
  id: string;
  label: string;
  kind: NodeKind;
  position: { x: number; y: number };
  summary: string;
  engineering: string;
  production: string;
  alternatives?: string[];
  concept?: string;
};

export type SystemEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: FlowKind;
};

export type PlaybackStep = {
  id: string;
  title: string;
  narration: string;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  payload: { label: string; fields?: Array<{ name: string; example: string }> };
  failure: string;
  observation: string;
};

export type KnowledgeCheck = {
  objectiveIndex: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Lesson = {
  schemaVersion: 1;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  audience: Array<"beginner" | "developer">;
  duration: number;
  difficulty: 1 | 2 | 3;
  topics: string[];
  prerequisites: string[];
  learningObjectives: string[];
  nodes: SystemNode[];
  edges: SystemEdge[];
  steps: PlaybackStep[];
  glossaryRefs: string[];
  checks: KnowledgeCheck[];
  variants?: Array<{
    id: string;
    label: string;
    description: string;
    nodeIds: string[];
    edgeIds: string[];
    steps?: PlaybackStep[];
  }>;
  simplification: string;
  owner: string;
  sources: Array<{ label: string; url: string }>;
  reviewedAt: string;
};

export type LessonSummary = Pick<
  Lesson,
  "slug" | "title" | "eyebrow" | "summary" | "duration" | "difficulty" | "topics"
> & {
  previewKinds: NodeKind[];
  layers: NodeKind[];
  searchText: string;
};

export type Concept = {
  slug: string;
  name: string;
  category: NodeKind | "foundation";
  plain: string;
  engineering: string;
  production: string;
};
