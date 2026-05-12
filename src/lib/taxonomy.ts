import taxonomyData from "../../data/taxonomy.json";
import type { Taxonomy } from "./eventTypes";

export const taxonomy = taxonomyData satisfies Taxonomy;

const macrotopicColorClasses: Record<string, string> = {
  automotive: "topic-automotive",
  energy: "topic-energy",
  "drilling-and-wells": "topic-drilling",
  "health-care": "topic-health",
  robotics: "topic-robotics",
  "industrial-operations": "topic-industrial",
  manufacturing: "topic-manufacturing",
  "thermal-systems": "topic-thermal",
  "startup-innovation": "topic-startup"
};

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

export function getMacrotopicColorClass(id: string): string {
  return macrotopicColorClasses[id] ?? "topic-default";
}

export function getSubtopicColorClass(id: string, source: Taxonomy = taxonomy): string {
  for (const macrotopic of source.macrotopics) {
    if (macrotopic.subtopics.some((candidate) => candidate.id === id)) {
      return getMacrotopicColorClass(macrotopic.id);
    }
  }

  return "topic-default";
}
