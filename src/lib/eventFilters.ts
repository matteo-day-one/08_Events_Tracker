import type { EventRecord } from "./eventTypes";
import { formatFee, formatMode } from "./formatters";
import { buildLocationIndex, locationCatalog, type LocationCatalogRecord } from "./locations";
import { getMacrotopicLabel, getSubtopicLabel } from "./taxonomy";

export type EventFilters = {
  query: string;
  macrotopics: string[];
  subtopics: string[];
  regions: string[];
  countries: string[];
  mode: string;
  feeType: string;
  startsAfter: string;
  deadlineBefore: string;
};

export type SortKey = "startDate" | "name" | "applicationDeadline" | "location" | "fee";

export type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

export const defaultFilters: EventFilters = {
  query: "",
  macrotopics: [],
  subtopics: [],
  regions: [],
  countries: [],
  mode: "all",
  feeType: "all",
  startsAfter: "",
  deadlineBefore: ""
};

export const defaultSort: SortState = {
  key: "startDate",
  direction: "asc"
};

export function filterEvents(
  events: EventRecord[],
  filters: EventFilters,
  locations: LocationCatalogRecord[] = locationCatalog
): EventRecord[] {
  const query = filters.query.trim().toLowerCase();
  const locationIndex = buildLocationIndex(locations);
  const hasRegionFilter = filters.regions.length > 0;
  const hasCountryFilter = filters.countries.length > 0;

  return events.filter((event) => {
    const searchableText = [
      event.name,
      event.description,
      event.location,
      event.website,
      formatMode(event.mode),
      formatFee(event.fee),
      ...event.macrotopics.map((id) => getMacrotopicLabel(id)),
      ...event.subtopics.map((id) => getSubtopicLabel(id))
    ]
      .join(" ")
      .toLowerCase();

    if (query && !searchableText.includes(query)) {
      return false;
    }

    if (
      (filters.macrotopics.length > 0 || filters.subtopics.length > 0) &&
      !filters.macrotopics.some((id) => event.macrotopics.includes(id)) &&
      !filters.subtopics.some((id) => event.subtopics.includes(id))
    ) {
      return false;
    }

    if (filters.mode !== "all" && event.mode !== filters.mode) {
      return false;
    }

    if (filters.feeType !== "all" && event.fee.type !== filters.feeType) {
      return false;
    }

    if (filters.startsAfter && event.startDate < filters.startsAfter) {
      return false;
    }

    if (
      filters.deadlineBefore &&
      (!event.applicationDeadline || event.applicationDeadline > filters.deadlineBefore)
    ) {
      return false;
    }

    if (hasRegionFilter || hasCountryFilter) {
      const location = locationIndex.get(event.location);
      if (!location) {
        return false;
      }

      if (hasRegionFilter && (!location.region || !filters.regions.includes(location.region))) {
        return false;
      }

      if (hasCountryFilter && (!location.country || !filters.countries.includes(location.country))) {
        return false;
      }
    }

    return true;
  });
}

export function sortEvents(events: EventRecord[], sort: SortState): EventRecord[] {
  return [...events].sort((a, b) => {
    const modifier = sort.direction === "asc" ? 1 : -1;
    const aValue = sortableValue(a, sort.key);
    const bValue = sortableValue(b, sort.key);

    return aValue.localeCompare(bValue) * modifier || a.name.localeCompare(b.name);
  });
}

function sortableValue(event: EventRecord, key: SortKey): string {
  if (key === "applicationDeadline") {
    return event.applicationDeadline ?? "9999-12-31";
  }

  if (key === "fee") {
    return formatFee(event.fee);
  }

  return event[key];
}
