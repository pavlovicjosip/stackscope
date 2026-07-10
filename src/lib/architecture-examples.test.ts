import { describe, expect, it } from "vitest";
import { defaultStack } from "@/content/architecture";
import { validateTechnologyGuides } from "@/content/technology-guides";
import { analyzeStack } from "./compatibility";
import { buildArchitectureExample } from "./architecture-examples";

describe("concrete architecture examples", () => {
  it("expands microservices into domain services with separately owned data", () => {
    const analysis = analyzeStack({ ...defaultStack, backendArchitecture: "microservices" });
    const example = buildArchitectureExample(analysis, "runtime");

    expect(example.nodes.filter((node) => node.id.endsWith("-service")).map((node) => node.label)).toEqual([
      "Identity service",
      "Catalog service",
      "Order service",
    ]);
    expect(example.nodes.filter((node) => node.kind === "data")).toHaveLength(3);
    expect(example.steps.find((step) => step.id === "data-ownership")?.whatHappens).toContain("never shared credentials");
  });

  it("expands microfrontends into a shell and independently routed applications", () => {
    const analysis = analyzeStack({ ...defaultStack, frontend: "angular", frontendArchitecture: "microfrontends" });
    const example = buildArchitectureExample(analysis, "runtime");

    expect(example.nodes.find((node) => node.id === "shell")?.technology).toBe("Angular host");
    expect(example.nodes.filter((node) => node.id.endsWith("-mfe")).map((node) => node.label)).toEqual([
      "Catalog frontend",
      "Account frontend",
      "Checkout frontend",
    ]);
    expect(example.edges.map((edge) => edge.label)).toEqual(expect.arrayContaining(["/catalog/*", "/account/*", "/checkout/*"]));
  });

  it("shows evidence, infrastructure, artifact, rollout, and redundant capacity in delivery view", () => {
    const example = buildArchitectureExample(analyzeStack(defaultStack), "delivery");
    expect(example.nodes.map((node) => node.label)).toEqual(expect.arrayContaining([
      "Validate + lint",
      "Test behavior matrix",
      "Build 2 immutable artifacts",
      "terraform plan",
      "Image registry set",
      "Task definition + ECS service",
      "ECS task A",
      "ECS task B",
    ]));
    expect(example.steps).toHaveLength(5);
    expect(example.steps.every((step) => step.failureMode && step.decision && step.concreteExample)).toBe(true);
  });

  it("provides a complete detailed guide for every catalog choice", () => {
    expect(validateTechnologyGuides()).toEqual([]);
  });
});
