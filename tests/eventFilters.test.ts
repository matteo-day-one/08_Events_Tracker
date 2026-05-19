import { describe, expect, it } from "vitest";
import { defaultFilters, filterEvents, type EventFilters } from "../src/lib/eventFilters";
import type { EventRecord } from "../src/lib/eventTypes";
import type { LocationCatalogRecord } from "../src/lib/locations";

const baseEvent: EventRecord = {
  id: "2026-base-event",
  name: "Base Event",
  description: "Baseline event",
  website: "https://example.org/base",
  location: "Milan, Italy",
  mode: "in-person",
  startDate: "2026-09-15",
  fee: { type: "free" },
  macrotopics: ["energy"],
  subtopics: ["batteries"],
  attachments: [],
  createdAt: "2026-05-12T08:00:00.000Z",
  updatedAt: "2026-05-12T08:00:00.000Z"
};

const events: EventRecord[] = [
  {
    ...baseEvent,
    id: "2026-clean-energy-summit",
    name: "Clean Energy Summit",
    location: "Milan, Italy",
    macrotopics: ["energy"],
    subtopics: ["batteries", "renewables"]
  },
  {
    ...baseEvent,
    id: "2026-medical-robotics-workshop",
    name: "Medical Robotics Workshop",
    location: "Online",
    mode: "online",
    macrotopics: ["robotics", "health-care"],
    subtopics: ["medical-robotics"]
  },
  {
    ...baseEvent,
    id: "2026-automate",
    name: "Automate",
    location: "Chicago, United States",
    macrotopics: ["robotics", "manufacturing"],
    subtopics: ["industrial-automation"]
  },
  {
    ...baseEvent,
    id: "2026-european-geothermal-workshop",
    name: "European Geothermal Workshop",
    location: "Berlin, Germany",
    macrotopics: ["energy"],
    subtopics: ["renewables"]
  },
  {
    ...baseEvent,
    id: "2026-gitex-nigeria",
    name: "GITEX Nigeria",
    location: "Abuja and Lagos, Nigeria",
    macrotopics: ["startup-innovation"],
    subtopics: ["startups"]
  }
];

const locations: LocationCatalogRecord[] = [
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
    location: "Chicago, United States",
    city: "Chicago",
    country: "United States",
    region: "North America",
    latitude: 41.8781,
    longitude: -87.6298,
    mappable: true
  },
  {
    location: "Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    region: "Europe",
    latitude: 52.52,
    longitude: 13.405,
    mappable: true
  },
  {
    location: "Abuja and Lagos, Nigeria",
    country: "Nigeria",
    region: "Africa",
    mappable: false
  },
  {
    location: "Online",
    mappable: false
  }
];

function withFilters(filters: Partial<EventFilters>): EventFilters {
  return { ...defaultFilters, ...filters };
}

describe("event filtering", () => {
  it("matches any selected macrotopic and any selected subtopic within each filter group", () => {
    const result = filterEvents(
      events,
      withFilters({
        macrotopics: ["robotics"],
        subtopics: ["batteries"]
      }),
      locations
    );

    expect(result.map((event) => event.id)).toEqual([
      "2026-clean-energy-summit",
      "2026-medical-robotics-workshop",
      "2026-automate"
    ]);
  });

  it("allows a child subtopic to filter without selecting its parent topic", () => {
    const result = filterEvents(events, withFilters({ subtopics: ["batteries"] }), locations);

    expect(result.map((event) => event.id)).toEqual(["2026-clean-energy-summit"]);
  });

  it("combines topic, region, and country groups as narrowing filters", () => {
    const result = filterEvents(
      events,
      withFilters({
        macrotopics: ["robotics"],
        regions: ["North America", "Europe"],
        countries: ["United States"]
      }),
      locations
    );

    expect(result.map((event) => event.id)).toEqual(["2026-automate"]);
  });

  it("filters a selected country without including sibling countries or other regions", () => {
    const result = filterEvents(events, withFilters({ countries: ["Italy"] }), locations);

    expect(result.map((event) => event.id)).toEqual(["2026-clean-energy-summit"]);
  });

  it("keeps non-mappable locations available to region and country filters when cataloged", () => {
    const result = filterEvents(
      events,
      withFilters({
        regions: ["Africa"],
        countries: ["Nigeria"]
      }),
      locations
    );

    expect(result.map((event) => event.id)).toEqual(["2026-gitex-nigeria"]);
  });

  it("excludes uncataloged locations when a geography filter is active", () => {
    const result = filterEvents(events, withFilters({ regions: ["Europe"] }), []);

    expect(result).toEqual([]);
  });
});
