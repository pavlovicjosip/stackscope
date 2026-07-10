import { concepts } from "@/content/concepts";
import { lessons } from "@/content/lessons";
import type { Concept, Lesson } from "@/content/types";

export function validateContent(
  lessonSet: Lesson[] = lessons,
  conceptSet: Concept[] = concepts,
): string[] {
  const errors: string[] = [];
  const lessonSlugs = new Set<string>();
  const conceptSlugs = new Set<string>();
  for (const concept of conceptSet) {
    if (conceptSlugs.has(concept.slug)) errors.push(`Duplicate concept slug: ${concept.slug}`);
    conceptSlugs.add(concept.slug);
  }

  for (const lesson of lessonSet) {
    if (lessonSlugs.has(lesson.slug)) errors.push(`Duplicate lesson slug: ${lesson.slug}`);
    lessonSlugs.add(lesson.slug);
    if (lesson.schemaVersion !== 1) errors.push(`${lesson.slug}: unsupported schema version ${lesson.schemaVersion}`);
    if (lesson.learningObjectives.length === 0) errors.push(`${lesson.slug}: missing learning objectives`);
    if (!lesson.owner.trim()) errors.push(`${lesson.slug}: missing content owner`);
    if (lesson.sources.length === 0) errors.push(`${lesson.slug}: missing sources`);
    for (const source of lesson.sources) {
      try {
        const url = new URL(source.url);
        if (url.protocol !== "https:") errors.push(`${lesson.slug}: source must use HTTPS: ${source.url}`);
      } catch {
        errors.push(`${lesson.slug}: invalid source URL: ${source.url}`);
      }
    }

    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const stepIds = new Set<string>();
    for (const node of lesson.nodes) {
      if (nodeIds.has(node.id)) errors.push(`${lesson.slug}: duplicate node ${node.id}`);
      nodeIds.add(node.id);
      if (node.concept && !conceptSlugs.has(node.concept)) {
        errors.push(`${lesson.slug}: node ${node.id} references missing concept ${node.concept}`);
      }
    }
    for (const edge of lesson.edges) {
      if (edgeIds.has(edge.id)) errors.push(`${lesson.slug}: duplicate edge ${edge.id}`);
      if (nodeIds.has(edge.id)) errors.push(`${lesson.slug}: selectable ID ${edge.id} is shared by a node and edge`);
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        errors.push(`${lesson.slug}: edge ${edge.id} has a missing endpoint`);
      }
    }
    for (const step of lesson.steps) {
      if (stepIds.has(step.id)) errors.push(`${lesson.slug}: duplicate step ${step.id}`);
      stepIds.add(step.id);
      for (const id of step.activeNodeIds) {
        if (!nodeIds.has(id)) errors.push(`${lesson.slug}: step ${step.id} references missing node ${id}`);
      }
      for (const id of step.activeEdgeIds) {
        if (!edgeIds.has(id)) errors.push(`${lesson.slug}: step ${step.id} references missing edge ${id}`);
      }
    }
    const variantIds = new Set<string>();
    for (const variant of lesson.variants ?? []) {
      if (variantIds.has(variant.id)) errors.push(`${lesson.slug}: duplicate variant ${variant.id}`);
      variantIds.add(variant.id);
      const variantNodeIds = new Set(variant.nodeIds);
      const variantEdgeIds = new Set(variant.edgeIds);
      for (const id of variant.nodeIds) {
        if (!nodeIds.has(id)) errors.push(`${lesson.slug}: variant ${variant.id} references missing node ${id}`);
      }
      for (const id of variant.edgeIds) {
        if (!edgeIds.has(id)) errors.push(`${lesson.slug}: variant ${variant.id} references missing edge ${id}`);
        const edge = lesson.edges.find((item) => item.id === id);
        if (edge && (!variantNodeIds.has(edge.source) || !variantNodeIds.has(edge.target))) {
          errors.push(`${lesson.slug}: variant ${variant.id} edge ${id} has a hidden endpoint`);
        }
      }
      const variantStepIds = new Set<string>();
      for (const step of variant.steps ?? []) {
        if (variantStepIds.has(step.id)) errors.push(`${lesson.slug}: variant ${variant.id} has duplicate step ${step.id}`);
        variantStepIds.add(step.id);
        for (const id of step.activeNodeIds) {
          if (!variantNodeIds.has(id)) errors.push(`${lesson.slug}: variant ${variant.id} step ${step.id} references hidden node ${id}`);
        }
        for (const id of step.activeEdgeIds) {
          if (!variantEdgeIds.has(id)) errors.push(`${lesson.slug}: variant ${variant.id} step ${step.id} references hidden edge ${id}`);
        }
      }
    }
    for (const ref of lesson.glossaryRefs) {
      if (!conceptSlugs.has(ref)) errors.push(`${lesson.slug}: missing glossary concept ${ref}`);
    }
    if (lesson.checks.length < 3 || lesson.checks.length > 5) {
      errors.push(`${lesson.slug}: expected 3–5 knowledge checks`);
    }
    for (const check of lesson.checks) {
      if (check.answer < 0 || check.answer >= check.options.length) {
        errors.push(`${lesson.slug}: knowledge-check answer is out of range`);
      }
      if (check.objectiveIndex < 0 || check.objectiveIndex >= lesson.learningObjectives.length) {
        errors.push(`${lesson.slug}: knowledge check maps to a missing objective`);
      }
    }
  }

  for (const lesson of lessonSet) {
    for (const prerequisite of lesson.prerequisites) {
      if (!lessonSlugs.has(prerequisite)) errors.push(`${lesson.slug}: missing prerequisite ${prerequisite}`);
    }
  }
  return errors;
}

const validationErrors = validateContent();
if (validationErrors.length > 0) {
  throw new Error(`Content validation failed:\n${validationErrors.join("\n")}`);
}

export const getLesson = (slug: string) => lessons.find((lesson) => lesson.slug === slug);
export const getConcept = (slug: string) => concepts.find((concept) => concept.slug === slug);
