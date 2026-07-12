import { describe, expect, it } from "vitest";
import { defaultStack } from "@/content/architecture";
import {
  compareFailureModes,
  compareStackSelections,
  defaultProjectContext,
  generateArchitectureAdr,
  migrationStepsFor,
  recommendArchitecture,
} from "./architecture-comparison";

describe("architecture comparison", () => {
  it("recommends a modular monolith for the default project context", () => {
    const recommendation = recommendArchitecture();

    expect(defaultProjectContext).toMatchObject({ engineers: 5, teams: 1, deliveryMonths: 3, traffic: "Medium", costSensitivity: "High", platformMaturity: "Low", cloudProvider: "AWS" });
    expect(recommendation.recommended.id).toBe("modular-monolith");
    expect(recommendation.reasons.join(" ")).toContain("Delivery speed");
    expect(recommendation.whatCouldChange).toContain("Several autonomous teams need independent release ownership.");
    expect(recommendation.alternatives.map((result) => result.variant.id)).toEqual(expect.arrayContaining(["microservices", "serverless"]));
  });

  it("changes the recommendation when team topology and platform maturity change", () => {
    const recommendation = recommendArchitecture({
      ...defaultProjectContext,
      engineers: 30,
      teams: 4,
      deliveryMonths: 12,
      traffic: "High",
      costSensitivity: "Low",
      platformMaturity: "High",
      teamExperience: "High",
      operationalComplexityTolerance: "High",
    });

    expect(recommendation.recommended.id).toBe("microservices");
  });

  it("makes microservices stack differences and failure consequences explicit", () => {
    const microservicesStack = { ...defaultStack, backendArchitecture: "microservices" };
    const differences = compareStackSelections(defaultStack, microservicesStack);
    const failures = compareFailureModes("modular-monolith", "microservices");

    expect(differences).toEqual([expect.objectContaining({ category: "backendArchitecture", before: "Modular monolith", after: "Microservices" })]);
    expect(failures.failureModes).toContainEqual(expect.objectContaining({ variant: "microservices", title: "Services form a distributed monolith", impact: "High" }));
    expect(failures.failureModes.find((failure) => failure.id === "partial-failure")?.mitigation).toContain("bounded retries");
    expect(migrationStepsFor("modular-monolith", "microservices").map((step) => step.title)).toContain("Extract one low-risk boundary");
  });

  it("exports a transparent Markdown ADR", () => {
    const recommendation = recommendArchitecture();
    const markdown = generateArchitectureAdr({
      title: "ADR-001: Backend architecture",
      status: "Accepted",
      context: defaultProjectContext,
      recommendation,
      migration: migrationStepsFor("modular-monolith", recommendation.recommended.id),
    });

    expect(markdown).toContain("# ADR-001: Backend architecture");
    expect(markdown).toContain("Status: Accepted");
    expect(markdown).toContain("Adopt **Modular monolith**");
    expect(markdown).toContain("## Alternatives considered");
    expect(markdown).toContain("**Microservices:**");
    expect(markdown).toContain("## What could change this decision");
  });
});
