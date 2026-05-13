import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { EventFilters } from "../lib/eventFilters";
import { defaultFilters } from "../lib/eventFilters";
import { getCountryOptions, getRegionOptions } from "../lib/locations";
import { taxonomy } from "../lib/taxonomy";

type FilterBarProps = {
  filters: EventFilters;
  resultCount: number;
  totalCount: number;
  onFiltersChange: (filters: EventFilters) => void;
};

type MultiFilterKey = "macrotopics" | "subtopics" | "regions" | "countries";

export function FilterBar({ filters, resultCount, totalCount, onFiltersChange }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<MultiFilterKey | null>(null);

  const updateFilter = (key: keyof EventFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (
    key: MultiFilterKey,
    value: string
  ) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((candidate) => candidate !== value)
      : [...current, value];

    onFiltersChange({ ...filters, [key]: next });
  };

  const clearArrayFilter = (key: MultiFilterKey) => {
    onFiltersChange({ ...filters, [key]: [] });
  };

  const subtopics = taxonomy.macrotopics.flatMap((topic) => topic.subtopics);
  const regions = getRegionOptions();
  const countries = getCountryOptions();

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

        <MultiSelectDropdown
          className="topic-filter"
          label="Topics"
          options={taxonomy.macrotopics.map((topic) => ({ value: topic.id, label: topic.label }))}
          selected={filters.macrotopics}
          isOpen={openDropdown === "macrotopics"}
          onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "macrotopics" : null)}
          onToggle={(value) => toggleArrayFilter("macrotopics", value)}
          onClear={() => clearArrayFilter("macrotopics")}
        />

        <MultiSelectDropdown
          className="subtopic-filter"
          label="Subtopics"
          options={subtopics.map((subtopic) => ({ value: subtopic.id, label: subtopic.label }))}
          selected={filters.subtopics}
          isOpen={openDropdown === "subtopics"}
          onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "subtopics" : null)}
          onToggle={(value) => toggleArrayFilter("subtopics", value)}
          onClear={() => clearArrayFilter("subtopics")}
        />

        <MultiSelectDropdown
          className="region-filter"
          label="Regions"
          options={regions.map((region) => ({ value: region, label: region }))}
          selected={filters.regions}
          isOpen={openDropdown === "regions"}
          onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "regions" : null)}
          onToggle={(value) => toggleArrayFilter("regions", value)}
          onClear={() => clearArrayFilter("regions")}
        />

        <MultiSelectDropdown
          className="country-filter"
          label="Countries"
          options={countries.map((country) => ({ value: country, label: country }))}
          selected={filters.countries}
          isOpen={openDropdown === "countries"}
          onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "countries" : null)}
          onToggle={(value) => toggleArrayFilter("countries", value)}
          onClear={() => clearArrayFilter("countries")}
        />

        <label className="select-field compact">
          <span>Mode</span>
          <select value={filters.mode} onChange={(event) => updateFilter("mode", event.target.value)}>
            <option value="all">All modes</option>
            <option value="in-person">In person</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>

        <label className="select-field compact">
          <span>Fee</span>
          <select
            value={filters.feeType}
            onChange={(event) => updateFilter("feeType", event.target.value)}
          >
            <option value="all">Any fee</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className="date-field">
          <span>Starts after</span>
          <input
            type="date"
            value={filters.startsAfter}
            onChange={(event) => updateFilter("startsAfter", event.target.value)}
          />
        </label>

        <label className="date-field">
          <span>Deadline before</span>
          <input
            type="date"
            value={filters.deadlineBefore}
            onChange={(event) => updateFilter("deadlineBefore", event.target.value)}
          />
        </label>
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

type CheckboxOption = {
  value: string;
  label: string;
};

function MultiSelectDropdown({
  className,
  label,
  options,
  selected,
  isOpen,
  onOpenChange,
  onToggle,
  onClear
}: {
  className: string;
  label: string;
  options: CheckboxOption[];
  selected: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();
  const menuId = useId();
  const summary = selected.length === 0 ? "All" : `${selected.length} selected`;

  useEffect(() => {
    if (!isOpen) {
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
    <div className={`multi-select-field ${className}`} ref={fieldRef}>
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
        <div aria-labelledby={labelId} className="multi-select-menu" id={menuId} role="group">
          <div className="multi-select-menu-header">
            <strong>{label}</strong>
            <button
              aria-label={`Clear ${label}`}
              className="multi-select-clear"
              disabled={selected.length === 0}
              type="button"
              onClick={onClear}
            >
              <X aria-hidden="true" size={14} />
            </button>
          </div>

          <div className="multi-select-options">
        {options.map((option) => (
          <label className="multi-select-option" key={option.value}>
            <input
              checked={selected.includes(option.value)}
              type="checkbox"
              onChange={() => onToggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
