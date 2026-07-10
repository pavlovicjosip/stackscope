import { describe, expect, it } from "vitest";
import { concepts } from "@/content/concepts";
import { lessons } from "@/content/lessons";
import { validateContent } from "./content";

describe("content", () => {
  it("ships six valid lessons and at least twenty concepts", () => {
    expect(lessons).toHaveLength(6);
    expect(concepts.length).toBeGreaterThanOrEqual(20);
    expect(validateContent()).toEqual([]);
  });

  it("reports missing references with lesson context", () => {
    const broken = structuredClone(lessons[0]);
    broken.steps[0].activeNodeIds.push("missing-node");
    expect(validateContent([broken], concepts)).toContain(
      `${broken.slug}: step ${broken.steps[0].id} references missing node missing-node`,
    );
  });

  it("rejects duplicate concepts and shared selectable identifiers", () => {
    const broken = structuredClone(lessons[0]);
    broken.edges[0].id = broken.nodes[0].id;
    const errors = validateContent([broken], [concepts[0], concepts[0]]);
    expect(errors).toContain(`Duplicate concept slug: ${concepts[0].slug}`);
    expect(errors).toContain(`${broken.slug}: selectable ID ${broken.nodes[0].id} is shared by a node and edge`);
  });

  it("rejects variant playback that references hidden architecture", () => {
    const broken = structuredClone(lessons.find((lesson) => lesson.slug === "scaling-a-service")!);
    const variant = broken.variants!.find((item) => item.id === "simple")!;
    variant.steps![0].activeNodeIds.push("lb");
    expect(validateContent([broken], concepts)).toContain(
      `${broken.slug}: variant simple step ${variant.steps![0].id} references hidden node lb`,
    );
  });
});
