import { describe, expect, it } from "vitest";
import { validateLocationCatalog } from "../src/lib/locations";
import type { EventRecord, LocationCatalogRecord } from "../src/lib/eventTypes";

const event: EventRecord = {
  id: "2026-clean-energy-summit",
  name: "Clean Energy Summit",
  description: "A forum for energy storage, grids, and industrial decarbonization.",
  website: "https://example.org/clean-energy",
  location: "Milan, Italy",
  mode: "hybrid",
  startDate: "2026-09-15",
  fee: { type: "free" },
  macrotopics: ["energy"],
  subtopics: ["batteries"],
  attachments: [],
  createdAt: "2026-05-12T08:00:00.000Z",
  updatedAt: "2026-05-12T08:00:00.000Z"
};

const validCatalog: LocationCatalogRecord[] = [
  {
    location: "Milan, Italy",
    city: "Milan",
    country: "Italy",
    region: "Europe",
    latitude: 45.4642,
    longitude: 9.19,
    mappable: true
  },
  {
    location: "Online",
    mappable: false
  }
];

describe("location catalog validation", () => {
  it("accepts catalog records for every event location", () => {
    expect(validateLocationCatalog(validCatalog, [event])).toEqual({ ok: true, errors: [] });
  });

  it("rejects duplicate catalog entries and missing event locations", () => {
    const result = validateLocationCatalog(
      [
        ...validCatalog,
        {
          location: "Milan, Italy",
          city: "Milan",
          country: "Italy",
          region: "Europe",
          latitude: 45.4642,
          longitude: 9.19,
          mappable: true
        }
      ],
      [{ ...event, location: "Chicago, United States" }]
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Duplicate location catalog entry: Milan, Italy.",
        "Missing location catalog entry for event location: Chicago, United States."
      ])
    );
  });

  it("requires valid coordinates for mappable records", () => {
    const result = validateLocationCatalog(
      [
        {
          location: "Milan, Italy",
          city: "Milan",
          country: "Italy",
          region: "Europe",
          latitude: 120,
          longitude: 220,
          mappable: true
        }
      ],
      [event]
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Location Milan, Italy latitude must be between -90 and 90.",
        "Location Milan, Italy longitude must be between -180 and 180."
      ])
    );
  });

  it("rejects mappable online records", () => {
    const result = validateLocationCatalog(
      [
        {
          location: "Online",
          country: "Online",
          region: "Europe",
          latitude: 0,
          longitude: 0,
          mappable: true
        }
      ],
      [{ ...event, location: "Online", mode: "online" }]
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Location Online cannot be mappable.");
  });
});
