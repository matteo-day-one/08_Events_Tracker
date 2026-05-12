import { describe, expect, it } from "vitest";
import {
  createEventSlug,
  validateEvent,
  validateEventCollection
} from "../src/lib/eventSchema";
import { taxonomy } from "../src/lib/taxonomy";

const validEvent = {
  id: "2026-clean-energy-summit",
  name: "Clean Energy Summit",
  description: "A forum for energy storage, grids, and industrial decarbonization.",
  website: "https://example.org/clean-energy",
  location: "Milan, Italy",
  mode: "hybrid",
  startDate: "2026-09-15",
  endDate: "2026-09-16",
  applicationDeadline: "2026-08-20",
  fee: {
    type: "paid",
    amount: 120,
    currency: "EUR",
    notes: "Student discount available"
  },
  macrotopics: ["energy"],
  subtopics: ["batteries"],
  attachments: [
    {
      label: "Program PDF",
      type: "external",
      url: "https://example.org/program.pdf"
    },
    {
      label: "Sponsor Pack",
      type: "repository",
      path: "data/attachments/2026-clean-energy-summit/sponsor-pack.pdf"
    }
  ],
  createdAt: "2026-05-12T08:00:00.000Z",
  updatedAt: "2026-05-12T08:00:00.000Z"
};

describe("event schema validation", () => {
  it("accepts a complete valid event", () => {
    expect(validateEvent(validEvent, taxonomy)).toEqual({ ok: true, errors: [] });
  });

  it("rejects malformed dates, unknown taxonomy tags, and broken attachment paths", () => {
    const result = validateEvent(
      {
        ...validEvent,
        id: "bad-event",
        startDate: "next spring",
        applicationDeadline: "2026-10-01",
        macrotopics: ["space"],
        subtopics: ["fusion"],
        attachments: [
          { label: "Broken external", type: "external", url: "not-a-url" },
          { label: "Broken repo", type: "repository", path: "../secret.pdf" }
        ]
      },
      taxonomy
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("startDate"),
        expect.stringContaining("applicationDeadline"),
        expect.stringContaining("Unknown macrotopic"),
        expect.stringContaining("Unknown subtopic"),
        expect.stringContaining("external attachment"),
        expect.stringContaining("repository attachment")
      ])
    );
  });

  it("rejects duplicate event ids in a collection", () => {
    const result = validateEventCollection([validEvent, validEvent], taxonomy);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([expect.stringContaining("Duplicate event id")]);
  });
});

describe("event slug creation", () => {
  it("creates stable readable ids from event names and start dates", () => {
    expect(createEventSlug("Clean Energy Summit!", "2026-09-15")).toBe(
      "2026-clean-energy-summit"
    );
  });
});
