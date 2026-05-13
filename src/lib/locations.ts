import locationData from "../../data/locations.json";
import type { EventRecord, LocationCatalogRecord, LocationRegion, ValidationResult } from "./eventTypes";

export type { LocationCatalogRecord } from "./eventTypes";

export const regionOrder: LocationRegion[] = [
  "Europe",
  "North America",
  "Asia",
  "Middle East",
  "Africa"
];

export const locationCatalog = locationData as LocationCatalogRecord[];

export type GlobePin = {
  event: EventRecord;
  location: LocationCatalogRecord & {
    latitude: number;
    longitude: number;
  };
};

export function buildLocationIndex(
  source: LocationCatalogRecord[] = locationCatalog
): Map<string, LocationCatalogRecord> {
  return new Map(source.map((entry) => [entry.location, entry]));
}

export function getEventLocation(
  event: EventRecord,
  source: LocationCatalogRecord[] = locationCatalog
): LocationCatalogRecord | undefined {
  return buildLocationIndex(source).get(event.location);
}

export function getRegionOptions(source: LocationCatalogRecord[] = locationCatalog): LocationRegion[] {
  const regions = new Set(source.flatMap((entry) => (entry.region ? [entry.region] : [])));
  return regionOrder.filter((region) => regions.has(region));
}

export function getCountryOptions(source: LocationCatalogRecord[] = locationCatalog): string[] {
  return [...new Set(source.flatMap((entry) => (entry.country ? [entry.country] : [])))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getGlobePins(
  events: EventRecord[],
  source: LocationCatalogRecord[] = locationCatalog
): GlobePin[] {
  const locationIndex = buildLocationIndex(source);

  return events.flatMap((event) => {
    const location = locationIndex.get(event.location);
    if (
      !location?.mappable ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return [];
    }

    return [{ event, location: { ...location, latitude: location.latitude, longitude: location.longitude } }];
  });
}

export function validateLocationCatalog(
  source: LocationCatalogRecord[],
  events: EventRecord[]
): ValidationResult {
  const errors: string[] = [];
  const seenLocations = new Set<string>();
  const eventLocations = new Set(events.map((event) => event.location));

  for (const entry of source) {
    if (!entry.location || typeof entry.location !== "string") {
      errors.push("Location catalog entries must include a non-empty location.");
      continue;
    }

    if (seenLocations.has(entry.location)) {
      errors.push(`Duplicate location catalog entry: ${entry.location}.`);
    }
    seenLocations.add(entry.location);

    validateRegion(entry, errors);
    validateCoordinates(entry, errors);
    validateMappableStatus(entry, errors);
  }

  for (const location of eventLocations) {
    if (!seenLocations.has(location)) {
      errors.push(`Missing location catalog entry for event location: ${location}.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function validateRegion(entry: LocationCatalogRecord, errors: string[]) {
  if (entry.region && !regionOrder.includes(entry.region)) {
    errors.push(`Location ${entry.location} region must be one of ${regionOrder.join(", ")}.`);
  }
}

function validateCoordinates(entry: LocationCatalogRecord, errors: string[]) {
  if (!entry.mappable) {
    return;
  }

  if (typeof entry.latitude !== "number" || entry.latitude < -90 || entry.latitude > 90) {
    errors.push(`Location ${entry.location} latitude must be between -90 and 90.`);
  }

  if (typeof entry.longitude !== "number" || entry.longitude < -180 || entry.longitude > 180) {
    errors.push(`Location ${entry.location} longitude must be between -180 and 180.`);
  }
}

function validateMappableStatus(entry: LocationCatalogRecord, errors: string[]) {
  if (!entry.mappable) {
    return;
  }

  const normalizedLocation = entry.location.toLowerCase();
  if (normalizedLocation === "online" || normalizedLocation.includes(" and ")) {
    errors.push(`Location ${entry.location} cannot be mappable.`);
  }
}
