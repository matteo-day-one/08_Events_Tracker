import { describe, expect, it } from "vitest";
import {
  createEventSlug,
  validateEvent,
  validateEventCollection
} from "../src/lib/eventSchema";
import { events } from "../src/generated/eventIndex";
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

  it("includes the controlled taxonomy needed for 2026 and 2027 industrial events", () => {
    expect(taxonomy.macrotopics.map((topic) => topic.id)).toEqual(
      expect.arrayContaining([
        "drilling-and-wells",
        "industrial-operations",
        "thermal-systems"
      ])
    );
    expect(taxonomy.macrotopics.flatMap((topic) => topic.subtopics).map((topic) => topic.id)).toEqual(
      expect.arrayContaining([
        "geothermal",
        "downhole-drilling",
        "well-integrity",
        "heat-recovery",
        "waste-heat",
        "thermal-energy-storage",
        "thermal-batteries",
        "solid-state-batteries",
        "thin-film-batteries",
        "high-temperature-batteries",
        "predictive-maintenance",
        "industrial-iot",
        "condition-monitoring",
        "gas-turbines",
        "turbomachinery",
        "rotating-equipment"
      ])
    );
  });

  it("includes the verified 2026 and 2027 seed events in the generated index", () => {
    expect(events.map((event) => event.id)).toEqual(
      expect.arrayContaining([
        "2026-aabc-europe",
        "2026-the-battery-show-europe",
        "2026-icemrb",
        "2026-carnot-batteries-workshop",
        "2026-batteries-event",
        "2026-mrs-en04",
        "2027-eesat",
        "2026-iadc-geothermal-drilling",
        "2026-celle-drilling",
        "2026-geothermal-rising-conference",
        "2026-asme-turbo-expo",
        "2026-intelligent-maintenance-conference",
        "2026-turbomachinery-pump-symposia",
        "2026-aimcs"
      ])
    );
  });
});

describe("event slug creation", () => {
  it("creates stable readable ids from event names and start dates", () => {
    expect(createEventSlug("Clean Energy Summit!", "2026-09-15")).toBe(
      "2026-clean-energy-summit"
    );
  });
});
