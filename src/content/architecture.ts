export type TechnologyCategory =
  | "frontend"
  | "frontendArchitecture"
  | "backend"
  | "backendArchitecture"
  | "database"
  | "ci"
  | "iac"
  | "packaging"
  | "compute"
  | "deployment";

export type Technology = {
  id: string;
  name: string;
  category: TechnologyCategory;
  mark: string;
  summary: string;
  runtime: string;
  protocols: string[];
  officialDomain?: string;
  docs: Array<{ label: string; url: string }>;
};

export type StackSelection = Record<TechnologyCategory, string>;

export type ArchitectureAssignments = {
  frontendApps: {
    catalog: string;
    account: string;
    checkout: string;
  };
  backendServices: {
    identity: string;
    catalog: string;
    orders: string;
  };
};

export type CompatibilityLevel = "compatible" | "conditional" | "incompatible";

export type ArchitectureFinding = {
  level: "blocker" | "warning" | "note";
  title: string;
  detail: string;
  technologyIds: string[];
};

export type ArchitectureConnection = {
  id: string;
  source: TechnologyCategory;
  target: TechnologyCategory;
  label: string;
  detail: string;
  kind: "request" | "data" | "delivery" | "artifact";
};

export type StackAnalysis = {
  level: CompatibilityLevel;
  headline: string;
  summary: string;
  findings: ArchitectureFinding[];
  connections: ArchitectureConnection[];
  selected: Record<TechnologyCategory, Technology>;
  assignments: ArchitectureAssignments;
};

export const categoryOrder: TechnologyCategory[] = ["frontend", "frontendArchitecture", "backend", "backendArchitecture", "database", "ci", "iac", "packaging", "compute", "deployment"];

export const categoryLabels: Record<TechnologyCategory, string> = {
  frontend: "Frontend",
  frontendArchitecture: "Frontend approach",
  backend: "Backend",
  backendArchitecture: "Backend approach",
  database: "Database",
  ci: "CI/CD",
  iac: "Infrastructure as code",
  packaging: "Packaging",
  compute: "Compute",
  deployment: "Deployment",
};

export const technologies: Technology[] = [
  { id: "react", name: "React", category: "frontend", mark: "R", summary: "Client UI composed from React components, commonly built as static assets or through a framework.", runtime: "Browser JavaScript", protocols: ["HTTPS", "JSON"], officialDomain: "react.dev", docs: [{ label: "Creating a React app", url: "https://react.dev/learn/creating-a-react-app" }] },
  { id: "next", name: "Next.js", category: "frontend", mark: "N", summary: "React framework supporting static, server-rendered, and full-stack routes.", runtime: "Browser + Node.js", protocols: ["HTTPS", "RSC", "JSON"], officialDomain: "nextjs.org", docs: [{ label: "Deploying Next.js", url: "https://nextjs.org/docs/app/guides/deploying-to-platforms" }, { label: "Self-hosting", url: "https://nextjs.org/docs/app/guides/self-hosting" }] },
  { id: "vue", name: "Vue", category: "frontend", mark: "V", summary: "Progressive UI framework that produces browser assets and can consume a separate API.", runtime: "Browser JavaScript", protocols: ["HTTPS", "JSON"], officialDomain: "vuejs.org", docs: [{ label: "Production deployment", url: "https://vuejs.org/guide/best-practices/production-deployment" }] },
  { id: "angular", name: "Angular", category: "frontend", mark: "NG", summary: "Application framework supporting client-side, server-side, hybrid, and static rendering.", runtime: "Browser + optional Node.js SSR", protocols: ["HTTPS", "JSON"], officialDomain: "angular.dev", docs: [{ label: "Angular deployment", url: "https://angular.dev/tools/cli/deployment" }, { label: "Server and hybrid rendering", url: "https://angular.dev/guide/prerendering" }] },

  { id: "spa", name: "Single-page app", category: "frontendArchitecture", mark: "SPA", summary: "One browser application owns navigation and calls remote APIs after the initial document load.", runtime: "Client-side rendering", protocols: ["HTTPS", "History API", "JSON"], officialDomain: "mozilla.org", docs: [{ label: "SPA glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/SPA" }] },
  { id: "ssr-bff", name: "SSR + BFF", category: "frontendArchitecture", mark: "SSR", summary: "A server-rendering tier shapes backend data for the UI and can mix static, server, and client rendering.", runtime: "Frontend server + browser", protocols: ["HTTPS", "HTML streaming", "JSON"], officialDomain: "nextjs.org", docs: [{ label: "Backend-for-frontend guide", url: "https://nextjs.org/docs/app/guides/backend-for-frontend" }, { label: "Self-hosting", url: "https://nextjs.org/docs/app/guides/self-hosting" }] },
  { id: "microfrontends", name: "Microfrontends", category: "frontendArchitecture", mark: "MF", summary: "Multiple independently deployed frontend applications render as one product through an explicit routing and ownership contract.", runtime: "Multiple frontend deployments", protocols: ["Path routing", "Shared domain", "HTTPS"], officialDomain: "vercel.com", docs: [{ label: "Microfrontends", url: "https://vercel.com/docs/microfrontends" }, { label: "Mixed-framework quickstart", url: "https://vercel.com/docs/microfrontends/quickstart" }, { label: "Path routing", url: "https://vercel.com/docs/microfrontends/path-routing" }] },

  { id: "express", name: "Express", category: "backend", mark: "EX", summary: "Minimal Node.js web framework with database access supplied by Node drivers.", runtime: "Node.js", protocols: ["HTTP", "JSON", "WebSocket"], officialDomain: "expressjs.com", docs: [{ label: "Database integration", url: "https://expressjs.com/en/guide/database-integration.html" }, { label: "Production best practices", url: "https://expressjs.com/en/advanced/best-practice-performance.html" }] },
  { id: "fastapi", name: "FastAPI", category: "backend", mark: "FA", summary: "Python API framework commonly packaged as a container or deployed to a Python runtime.", runtime: "Python / ASGI", protocols: ["HTTP", "JSON", "OpenAPI"], officialDomain: "fastapi.tiangolo.com", docs: [{ label: "FastAPI in containers", url: "https://fastapi.tiangolo.com/deployment/docker/" }, { label: "Deployment concepts", url: "https://fastapi.tiangolo.com/deployment/" }] },
  { id: "spring", name: "Spring Boot", category: "backend", mark: "SB", summary: "JVM application framework with first-class database and container-image support.", runtime: "Java / JVM", protocols: ["HTTP", "JSON", "JDBC"], officialDomain: "spring.io", docs: [{ label: "Spring Boot with Docker", url: "https://spring.io/guides/gs/spring-boot-docker/" }, { label: "Spring Boot on Kubernetes", url: "https://spring.io/guides/gs/spring-boot-kubernetes/" }] },

  { id: "modular-monolith", name: "Modular monolith", category: "backendArchitecture", mark: "MM", summary: "One deployable application with enforced domain modules and internal dependency boundaries.", runtime: "Single service boundary", protocols: ["In-process calls", "Transactions"], officialDomain: "spring.io", docs: [{ label: "Spring Modulith fundamentals", url: "https://docs.spring.io/spring-modulith/reference/fundamentals.html" }] },
  { id: "microservices", name: "Microservices", category: "backendArchitecture", mark: "MS", summary: "Domain-aligned services deploy independently and communicate over explicit network contracts.", runtime: "Multiple service boundaries", protocols: ["HTTP/gRPC", "Events", "Service discovery"], officialDomain: "amazon.com", docs: [{ label: "Microservices architecture on AWS", url: "https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/simple-microservices-architecture-on-aws.html" }, { label: "Database per service", url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/database-per-service.html" }] },
  { id: "serverless", name: "Serverless functions", category: "backendArchitecture", mark: "FN", summary: "Event-triggered functions scale on demand without a team-managed application server fleet.", runtime: "Managed functions", protocols: ["Events", "HTTPS", "Provider APIs"], officialDomain: "amazon.com", docs: [{ label: "Lambda concepts", url: "https://docs.aws.amazon.com/lambda/latest/dg/concepts-basics.html" }, { label: "Lambda runtime environment", url: "https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" }] },

  { id: "postgres", name: "PostgreSQL", category: "database", mark: "PG", summary: "Relational database reached from application processes through PostgreSQL client drivers.", runtime: "Database server", protocols: ["PostgreSQL wire", "SQL", "TLS"], officialDomain: "postgresql.org", docs: [{ label: "Client interfaces", url: "https://www.postgresql.org/docs/current/client-interfaces.html" }, { label: "Database server connections", url: "https://www.postgresql.org/docs/current/app-postgres.html" }] },
  { id: "mysql", name: "MySQL", category: "database", mark: "MY", summary: "Relational database with official connectors for Java, Python, Node.js, and other runtimes.", runtime: "Database server", protocols: ["MySQL protocol", "SQL", "TLS"], officialDomain: "mysql.com", docs: [{ label: "Connectors and APIs", url: "https://dev.mysql.com/doc/refman/en/connectors-apis.html" }] },
  { id: "mongodb", name: "MongoDB", category: "database", mark: "MO", summary: "Document database accessed through language-specific drivers and protected connection strings.", runtime: "Database server", protocols: ["MongoDB wire", "BSON", "TLS"], officialDomain: "mongodb.com", docs: [{ label: "Connect with the Node.js driver", url: "https://www.mongodb.com/docs/drivers/node/current/connect/" }] },

  { id: "github-actions", name: "GitHub Actions", category: "ci", mark: "GH", summary: "Repository-triggered workflows that build, test, package, and deploy through jobs.", runtime: "Managed or self-hosted runners", protocols: ["Git", "YAML", "OIDC"], officialDomain: "github.com", docs: [{ label: "Workflow concepts", url: "https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows" }, { label: "Deployment environments", url: "https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments" }] },
  { id: "gitlab-ci", name: "GitLab CI/CD", category: "ci", mark: "GL", summary: "Stage and job pipelines executed by GitLab runners from a .gitlab-ci.yml definition.", runtime: "GitLab runners", protocols: ["Git", "YAML", "OIDC"], officialDomain: "gitlab.com", docs: [{ label: "CI/CD pipelines", url: "https://docs.gitlab.com/ci/pipelines/" }, { label: "Runners", url: "https://docs.gitlab.com/ci/runners/" }] },
  { id: "jenkins", name: "Jenkins", category: "ci", mark: "JE", summary: "Self-managed automation server using Jenkinsfiles, agents, and plugins for delivery pipelines.", runtime: "Controller + agents", protocols: ["Git", "Groovy", "CLI/API"], officialDomain: "jenkins.io", docs: [{ label: "Jenkins Pipeline", url: "https://www.jenkins.io/doc/book/pipeline/" }, { label: "Docker with Pipeline", url: "https://www.jenkins.io/doc/book/pipeline/docker/" }] },

  { id: "terraform", name: "Terraform", category: "iac", mark: "TF", summary: "Provider-based infrastructure as code using a write, plan, and apply workflow with state.", runtime: "Terraform CLI / remote runs", protocols: ["HCL", "Provider APIs", "State"], officialDomain: "hashicorp.com", docs: [{ label: "What is Terraform", url: "https://developer.hashicorp.com/terraform/intro" }, { label: "Core workflow", url: "https://developer.hashicorp.com/terraform/intro/core-workflow" }] },
  { id: "cloudformation", name: "CloudFormation", category: "iac", mark: "CF", summary: "AWS-native templates provision related cloud resources as versioned stacks.", runtime: "AWS control plane", protocols: ["YAML/JSON", "AWS APIs", "Change sets"], officialDomain: "amazon.com", docs: [{ label: "CloudFormation documentation", url: "https://docs.aws.amazon.com/cloudformation/" }, { label: "CloudFormation stacks", url: "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html" }] },
  { id: "pulumi", name: "Pulumi", category: "iac", mark: "PU", summary: "Infrastructure as code authored in general-purpose languages or YAML through cloud providers.", runtime: "Pulumi engine", protocols: ["Provider APIs", "State", "TypeScript/Python/Go"], officialDomain: "pulumi.com", docs: [{ label: "Pulumi IaC", url: "https://www.pulumi.com/docs/iac/" }, { label: "How Pulumi works", url: "https://www.pulumi.com/docs/intro/concepts/how-pulumi-works/" }] },

  { id: "docker", name: "Docker image", category: "packaging", mark: "DO", summary: "OCI-style image packaging with reproducible application dependencies and runtime metadata.", runtime: "Linux container", protocols: ["OCI image", "Registry API"], officialDomain: "docker.com", docs: [{ label: "Build, tag, and publish", url: "https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/" }, { label: "Push an image", url: "https://docs.docker.com/reference/cli/docker/image/push/" }] },
  { id: "source", name: "Source / build output", category: "packaging", mark: "<>" , summary: "Provider builds source or serves generated static assets without a user-managed container image.", runtime: "Provider build", protocols: ["Git", "Build output"], officialDomain: "vercel.com", docs: [{ label: "Build Output API", url: "https://vercel.com/docs/build-output-api/v3" }] },

  { id: "fargate", name: "AWS Fargate", category: "compute", mark: "FG", summary: "On-demand managed compute for ECS tasks or EKS Pods without managing virtual-machine fleets.", runtime: "Managed container compute", protocols: ["Task/Pod ENI", "IAM", "Container image"], officialDomain: "amazon.com", docs: [{ label: "Fargate on Amazon EKS", url: "https://docs.aws.amazon.com/eks/latest/userguide/fargate.html" }, { label: "Amazon ECS compute options", url: "https://docs.aws.amazon.com/AmazonECS/latest/APIReference/Welcome.html" }] },
  { id: "ec2", name: "Amazon EC2", category: "compute", mark: "E2", summary: "Virtual-machine compute with explicit operating-system, capacity, scaling, and patching responsibility.", runtime: "Virtual machines", protocols: ["VPC networking", "Instance metadata", "Autoscaling"], officialDomain: "amazon.com", docs: [{ label: "Amazon EC2 instances", url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Instances.html" }] },
  { id: "vercel-functions", name: "Vercel Functions", category: "compute", mark: "VF", summary: "Managed server-side functions that adapt to demand and connect to APIs and databases.", runtime: "Managed functions", protocols: ["HTTPS", "Events", "Provider runtime"], officialDomain: "vercel.com", docs: [{ label: "Vercel Functions", url: "https://vercel.com/docs/functions" }, { label: "Function runtimes", url: "https://vercel.com/docs/functions/runtimes" }] },

  { id: "kubernetes", name: "Kubernetes", category: "deployment", mark: "K8", summary: "Container orchestrator using workloads, Pods, and Services for deployment and discovery.", runtime: "Container cluster", protocols: ["OCI image", "Service DNS", "HTTP/TCP"], officialDomain: "kubernetes.io", docs: [{ label: "Workloads", url: "https://kubernetes.io/docs/concepts/workloads/" }, { label: "Services", url: "https://kubernetes.io/docs/concepts/services-networking/service/" }, { label: "Container images", url: "https://kubernetes.io/docs/concepts/containers/images/" }] },
  { id: "vercel", name: "Vercel", category: "deployment", mark: "VE", summary: "Managed frontend and function platform with framework-aware builds and global delivery.", runtime: "CDN + functions", protocols: ["Git", "HTTPS", "Functions"], officialDomain: "vercel.com", docs: [{ label: "Supported frameworks", url: "https://vercel.com/docs/frameworks" }, { label: "Function runtimes", url: "https://vercel.com/docs/functions/runtimes" }] },
  { id: "ecs", name: "AWS ECS", category: "deployment", mark: "EC", summary: "AWS container service that maintains tasks and can route traffic through managed load balancers.", runtime: "Container service", protocols: ["OCI image", "HTTP/TCP", "AWS API"], officialDomain: "amazon.com", docs: [{ label: "ECS service load balancing", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html" }, { label: "ECS service definition", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service_definition_parameters.html" }, { label: "Container health checks", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/healthcheck.html" }] },
];

export const defaultStack: StackSelection = {
  frontend: "next",
  frontendArchitecture: "ssr-bff",
  backend: "express",
  backendArchitecture: "modular-monolith",
  database: "postgres",
  ci: "github-actions",
  iac: "terraform",
  packaging: "docker",
  compute: "fargate",
  deployment: "ecs",
};

export const technologiesByCategory = Object.fromEntries(
  Object.keys(categoryLabels).map((category) => [category, technologies.filter((technology) => technology.category === category)]),
) as Record<TechnologyCategory, Technology[]>;

export function validateTechnologies(items: Technology[] = technologies): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) errors.push(`Duplicate technology ID: ${item.id}`);
    ids.add(item.id);
    if (item.id !== "source" && item.docs.length === 0) errors.push(`${item.id}: missing official documentation`);
    for (const source of item.docs) {
      try {
        const url = new URL(source.url);
        if (url.protocol !== "https:") errors.push(`${item.id}: documentation must use HTTPS`);
        if (item.officialDomain && !url.hostname.endsWith(item.officialDomain)) errors.push(`${item.id}: non-official documentation host ${url.hostname}`);
      } catch {
        errors.push(`${item.id}: invalid documentation URL ${source.url}`);
      }
    }
  }
  for (const category of Object.keys(categoryLabels) as TechnologyCategory[]) {
    if (!items.some((item) => item.category === category)) errors.push(`${category}: no technologies configured`);
  }
  return errors;
}

const technologyErrors = validateTechnologies();
if (technologyErrors.length > 0) throw new Error(`Technology catalog validation failed:\n${technologyErrors.join("\n")}`);
