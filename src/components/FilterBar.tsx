import { ChevronDown, ChevronRight, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { EventFilters } from "../lib/eventFilters";
import { defaultFilters } from "../lib/eventFilters";
import { getCountriesByRegion } from "../lib/locations";
import { taxonomy } from "../lib/taxonomy";

type FilterBarProps = {
  filters: EventFilters;
  resultCount: number;
  totalCount: number;
  onFiltersChange: (filters: EventFilters) => void;
};

type DropdownKey = "topics" | "location";

type HierarchicalGroup = {
  value: string;
  label: string;
  children: {
    value: string;
    label: string;
  }[];
};

export function FilterBar({ filters, resultCount, totalCount, onFiltersChange }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  const updateFilter = (key: keyof EventFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const topicGroups: HierarchicalGroup[] = taxonomy.macrotopics.map((topic) => ({
    value: topic.id,
    label: topic.label,
    children: topic.subtopics.map((subtopic) => ({ value: subtopic.id, label: subtopic.label }))
  }));

  const locationGroups: HierarchicalGroup[] = getCountriesByRegion().map((group) => ({
    value: group.region,
    label: group.region,
    children: group.countries.map((country) => ({ value: country, label: country }))
  }));

  const toggleTopic = (topicId: string) => {
    const topic = topicGroups.find((group) => group.value === topicId);
    if (!topic) {
      return;
    }

    const childIds = topic.children.map((child) => child.value);
    const allChildrenSelected = childIds.every((id) => filters.subtopics.includes(id));

    if (allChildrenSelected) {
      onFiltersChange({
        ...filters,
        macrotopics: filters.macrotopics.filter((id) => id !== topicId),
        subtopics: filters.subtopics.filter((id) => !childIds.includes(id))
      });
      return;
    }

    onFiltersChange({
      ...filters,
      macrotopics: addUnique(filters.macrotopics, topicId),
      subtopics: addUnique(filters.subtopics, childIds)
    });
  };

  const toggleSubtopic = (topicId: string, subtopicId: string) => {
    const topic = topicGroups.find((group) => group.value === topicId);
    if (!topic) {
      return;
    }

    const nextSubtopics = toggleValue(filters.subtopics, subtopicId);
    const childIds = topic.children.map((child) => child.value);
    const allChildrenSelected = childIds.every((id) => nextSubtopics.includes(id));

    onFiltersChange({
      ...filters,
      macrotopics: allChildrenSelected
        ? addUnique(filters.macrotopics, topicId)
        : filters.macrotopics.filter((id) => id !== topicId),
      subtopics: nextSubtopics
    });
  };

  const toggleRegion = (region: string) => {
    const group = locationGroups.find((candidate) => candidate.value === region);
    if (!group) {
      return;
    }

    const childCountries = group.children.map((child) => child.value);
    const allChildrenSelected = childCountries.every((country) => filters.countries.includes(country));

    if (allChildrenSelected) {
      onFiltersChange({
        ...filters,
        regions: filters.regions.filter((candidate) => candidate !== region),
        countries: filters.countries.filter((country) => !childCountries.includes(country))
      });
      return;
    }

    onFiltersChange({
      ...filters,
      regions: addUnique(filters.regions, region),
      countries: addUnique(filters.countries, childCountries)
    });
  };

  const toggleCountry = (region: string, country: string) => {
    const group = locationGroups.find((candidate) => candidate.value === region);
    if (!group) {
      return;
    }

    const nextCountries = toggleValue(filters.countries, country);
    const childCountries = group.children.map((child) => child.value);
    const allChildrenSelected = childCountries.every((candidate) => nextCountries.includes(candidate));

    onFiltersChange({
      ...filters,
      regions: allChildrenSelected
        ? addUnique(filters.regions, region)
        : filters.regions.filter((candidate) => candidate !== region),
      countries: nextCountries
    });
  };

  return (
    <section className="filter-band" aria-label="Event filters">
      <div className="filter-toolbar">
        <div className="search-field">
          <Search aria-hidden="true" size={18} />
          <label htmlFor="event-search">Search events</label>
          <input
            id="event-search"
            type="search"
            value={filters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder="Name, topic, location, description"
          />
        </div>

        <HierarchicalFilterDropdown
          className="topic-filter"
          label="Topics"
          childLabel="subtopics"
          groups={topicGroups}
          selectedParents={filters.macrotopics}
          selectedChildren={filters.subtopics}
          isOpen={openDropdown === "topics"}
          onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "topics" : null)}
          onToggleParent={toggleTopic}
          onToggleChild={toggleSubtopic}
          onClear={() => onFiltersChange({ ...filters, macrotopics: [], subtopics: [] })}
        />

        <HierarchicalFilterDropdown
          className="location-filter"
          label="Location"
          childLabel="countries"
          groups={locationGroups}
          selectedParents={filters.regions}
          selectedChildren={filters.countries}
          isOpen={openDropdown === "location"}
          onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "location" : null)}
          onToggleParent={toggleRegion}
          onToggleChild={toggleCountry}
          onClear={() => onFiltersChange({ ...filters, regions: [], countries: [] })}
        />
      </div>

      <div className="filter-actions-row">
        <div className="filter-summary" aria-live="polite">
          <strong>{resultCount}</strong>
          <span>of {totalCount}</span>
        </div>

        <button className="icon-button secondary" type="button" onClick={() => onFiltersChange(defaultFilters)}>
          <RotateCcw aria-hidden="true" size={16} />
          Reset
        </button>
      </div>
    </section>
  );
}

function HierarchicalFilterDropdown({
  className,
  label,
  childLabel,
  groups,
  selectedParents,
  selectedChildren,
  isOpen,
  onOpenChange,
  onToggleParent,
  onToggleChild,
  onClear
}: {
  className: string;
  label: string;
  childLabel: string;
  groups: HierarchicalGroup[];
  selectedParents: string[];
  selectedChildren: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onToggleParent: (parent: string) => void;
  onToggleChild: (parent: string, child: string) => void;
  onClear: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();
  const menuId = useId();
  const selectedSummary = getSelectionSummary(groups, selectedParents, selectedChildren);
  const summary = selectedSummary.length === 0 ? "All" : selectedSummary.join(", ");
  const hasSelection = selectedParents.length > 0 || selectedChildren.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setOpenGroup(null);
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !fieldRef.current?.contains(event.target)) {
        onOpenChange(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div className={`multi-select-field hierarchical-filter ${className}`} ref={fieldRef}>
      <span className="multi-select-label" id={labelId}>
        {label}
      </span>
      <button
        aria-label={`${label} ${summary}`}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="multi-select-trigger"
        type="button"
        onClick={() => onOpenChange(!isOpen)}
      >
        <span>{summary}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </button>

      {isOpen ? (
        <div aria-labelledby={labelId} className="multi-select-menu hierarchical-menu" id={menuId} role="group">
          <div className="multi-select-menu-header">
            <strong>{label}</strong>
            <button
              aria-label={`Clear ${label}`}
              className="multi-select-clear"
              disabled={!hasSelection}
              type="button"
              onClick={onClear}
            >
              <X aria-hidden="true" size={14} />
            </button>
          </div>

          <div className="hierarchical-options">
            {groups.map((group) => {
              const childValues = group.children.map((child) => child.value);
              const allChildrenSelected =
                childValues.length > 0 && childValues.every((child) => selectedChildren.includes(child));
              const someChildrenSelected = childValues.some((child) => selectedChildren.includes(child));
              const isExpanded = openGroup === group.value;

              return (
                <div className="hierarchical-group" key={group.value} onMouseEnter={() => setOpenGroup(group.value)}>
                  <div className="hierarchical-parent-row">
                    <label className="multi-select-option hierarchical-parent-option">
                      <input
                        checked={allChildrenSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = !allChildrenSelected && someChildrenSelected;
                          }
                        }}
                        type="checkbox"
                        onChange={() => onToggleParent(group.value)}
                      />
                      <span>{group.label}</span>
                    </label>
                    <button
                      aria-expanded={isExpanded}
                      aria-label={`Show ${group.label} ${childLabel}`}
                      className="hierarchical-child-toggle"
                      type="button"
                      onClick={() => setOpenGroup(group.value)}
                      onMouseEnter={() => setOpenGroup(group.value)}
                    >
                      <ChevronRight aria-hidden="true" size={16} />
                    </button>
                  </div>

                  {isExpanded ? (
                    <div aria-label={`${group.label} ${childLabel}`} className="hierarchical-children" role="group">
                      {group.children.map((child) => (
                        <label className="multi-select-option hierarchical-child-option" key={child.value}>
                          <input
                            checked={selectedChildren.includes(child.value)}
                            type="checkbox"
                            onChange={() => onToggleChild(group.value, child.value)}
                          />
                          <span>{child.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getSelectionSummary(
  groups: HierarchicalGroup[],
  selectedParents: string[],
  selectedChildren: string[]
): string[] {
  const summary: string[] = [];

  for (const group of groups) {
    const childValues = group.children.map((child) => child.value);
    const allChildrenSelected =
      childValues.length > 0 && childValues.every((child) => selectedChildren.includes(child));

    if (selectedParents.includes(group.value) || allChildrenSelected) {
      summary.push(group.label);
      continue;
    }

    for (const child of group.children) {
      if (selectedChildren.includes(child.value)) {
        summary.push(child.label);
      }
    }
  }

  return summary.slice(0, 3);
}

function addUnique(current: string[], value: string): string[];
function addUnique(current: string[], values: string[]): string[];
function addUnique(current: string[], valueOrValues: string | string[]): string[] {
  const next = new Set(current);
  const values = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues];

  values.forEach((value) => next.add(value));

  return [...next];
}

function toggleValue(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((candidate) => candidate !== value)
    : [...current, value];
}
