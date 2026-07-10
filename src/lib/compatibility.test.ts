import { describe, expect, it } from "vitest";
import { defaultStack, technologies, validateTechnologies } from "@/content/architecture";
import { analyzeStack, normalizeStackSelection, parseArchitectureAssignments, parseStackParams, toStackParams } from "./compatibility";

describe("stack compatibility", () => {
  it("ships a catalog backed by official HTTPS documentation", () => {
    expect(technologies.length).toBeGreaterThanOrEqual(28);
    expect(validateTechnologies()).toEqual([]);
  });

  it("finds the missing container boundary for container schedulers", () => {
    const result = analyzeStack({ ...defaultStack, packaging: "source", deployment: "kubernetes" });
    expect(result.level).toBe("incompatible");
    expect(result.findings).toContainEqual(expect.objectContaining({ level: "blocker", title: "Kubernetes needs a container image" }));
  });

  it("distinguishes compatible stacks from conditional platform fits", () => {
    const compatible = analyzeStack({ ...defaultStack, frontend: "vue", frontendArchitecture: "spa", backend: "fastapi", database: "mongodb" });
    expect(compatible.level).toBe("compatible");
    expect(compatible.connections.find((connection) => connection.id === "backend-database")?.label).toContain("PyMongo");

    const conditional = analyzeStack({ ...defaultStack, backend: "spring", packaging: "source", compute: "vercel-functions", deployment: "vercel" });
    expect(conditional.level).toBe("conditional");
    expect(conditional.findings).toContainEqual(expect.objectContaining({ title: "Spring Boot is not a native Vercel function runtime" }));
  });

  it("evaluates architecture patterns and infrastructure control planes", () => {
    const microfrontends = analyzeStack({ ...defaultStack, frontend: "angular", frontendArchitecture: "microfrontends", backendArchitecture: "microservices" });
    expect(microfrontends.level).toBe("conditional");
    expect(microfrontends.findings).toContainEqual(expect.objectContaining({ title: "Microfrontends require organizational boundaries, not only routing" }));
    expect(microfrontends.findings).toContainEqual(expect.objectContaining({ title: "One database engine must not become one shared ownership boundary" }));

    const mixedControlPlanes = analyzeStack({ ...defaultStack, iac: "cloudformation", compute: "fargate", deployment: "vercel" });
    expect(mixedControlPlanes.level).toBe("incompatible");
    expect(mixedControlPlanes.findings).toContainEqual(expect.objectContaining({ title: "CloudFormation cannot own a Vercel deployment" }));

    const eksFargate = analyzeStack({ ...defaultStack, deployment: "kubernetes", compute: "fargate" });
    expect(eksFargate.level).toBe("conditional");
    expect(eksFargate.findings).toContainEqual(expect.objectContaining({ title: "Kubernetes on Fargate means Amazon EKS" }));
  });

  it("normalizes and serializes public stack configuration", () => {
    const parsed = parseStackParams(new URLSearchParams("frontend=vue&backend=missing&database=mongodb"));
    expect(parsed.frontend).toBe("vue");
    expect(parsed.backend).toBe(defaultStack.backend);
    expect(parsed.database).toBe("mongodb");
    expect(normalizeStackSelection(parsed)).toEqual(parsed);
    expect(toStackParams(parsed).get("frontend")).toBe("vue");
  });

  it("models and serializes framework-agnostic microfrontends and microservices", () => {
    const selection = { ...defaultStack, frontendArchitecture: "microfrontends", backendArchitecture: "microservices" };
    const assignments = parseArchitectureAssignments(new URLSearchParams("mfeCatalog=react&mfeAccount=angular&mfeCheckout=vue&svcIdentity=spring&svcCatalog=fastapi&svcOrders=express"), selection);
    const result = analyzeStack(selection, assignments);

    expect(result.assignments.frontendApps).toEqual({ catalog: "react", account: "angular", checkout: "vue" });
    expect(result.assignments.backendServices).toEqual({ identity: "spring", catalog: "fastapi", orders: "express" });
    expect(result.findings).toContainEqual(expect.objectContaining({ title: "Mixed frontend frameworks are compatible at application boundaries" }));
    expect(result.findings).toContainEqual(expect.objectContaining({ title: "Polyglot services are compatible through network contracts" }));
    expect(result.findings).toContainEqual(expect.objectContaining({ title: "Spring Boot ↔ PostgreSQL: use the supported driver boundary" }));
    const params = toStackParams(selection, assignments);
    expect(params.get("mfeAccount")).toBe("angular");
    expect(params.get("svcCatalog")).toBe("fastapi");
  });
});
