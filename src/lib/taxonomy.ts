import taxonomyData from "../../data/taxonomy.json";
import type { Taxonomy } from "./eventTypes";

export const taxonomy = taxonomyData satisfies Taxonomy;

export function getMacrotopicLabel(id: string, source: Taxonomy = taxonomy): string {
  return source.macrotopics.find((topic) => topic.id === id)?.label ?? id;
}

export function getSubtopicLabel(id: string, source: Taxonomy = taxonomy): string {
  for (const macrotopic of source.macrotopics) {
    const subtopic = macrotopic.subtopics.find((candidate) => candidate.id === id);
    if (subtopic) {
      return subtopic.label;
    }
  }

  return id;
}
