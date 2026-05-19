import { describe, expect, it } from "vitest";
import {
  getMacrotopicIdForSubtopic,
  getSubtopicsForMacrotopic,
  taxonomy
} from "../src/lib/taxonomy";

describe("taxonomy hierarchy", () => {
  it("keeps battery chemistry under Energy instead of Automotive", () => {
    expect(getMacrotopicIdForSubtopic("solid-state-batteries")).toBe("energy");
    expect(getMacrotopicIdForSubtopic("high-temperature-batteries")).toBe("energy");
  });

  it("keeps manufacturing subfields under Manufacturing", () => {
    expect(getMacrotopicIdForSubtopic("industrial-automation")).toBe("manufacturing");
    expect(getMacrotopicIdForSubtopic("advanced-manufacturing")).toBe("manufacturing");
  });

  it("returns all child subtopics for a selected macrotopic", () => {
    expect(getSubtopicsForMacrotopic("energy").map((subtopic) => subtopic.id)).toEqual(
      expect.arrayContaining(["batteries", "solid-state-batteries", "high-temperature-batteries"])
    );
  });

  it("assigns every subtopic id to exactly one macrotopic", () => {
    const subtopicIds = taxonomy.macrotopics.flatMap((topic) => topic.subtopics.map((subtopic) => subtopic.id));

    expect(new Set(subtopicIds).size).toBe(subtopicIds.length);
  });
});
