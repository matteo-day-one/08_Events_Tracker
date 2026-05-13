import { RotateCcw, Search } from "lucide-react";
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

export function FilterBar({ filters, resultCount, totalCount, onFiltersChange }: FilterBarProps) {
  const updateFilter = (key: keyof EventFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (
    key: "macrotopics" | "subtopics" | "regions" | "countries",
    value: string
  ) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((candidate) => candidate !== value)
      : [...current, value];

    onFiltersChange({ ...filters, [key]: next });
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

        <CheckboxGroup
          className="topic-filter"
          legend="Topics"
          options={taxonomy.macrotopics.map((topic) => ({ value: topic.id, label: topic.label }))}
          selected={filters.macrotopics}
          onToggle={(value) => toggleArrayFilter("macrotopics", value)}
        />

        <CheckboxGroup
          className="subtopic-filter"
          legend="Subtopics"
          options={subtopics.map((subtopic) => ({ value: subtopic.id, label: subtopic.label }))}
          selected={filters.subtopics}
          onToggle={(value) => toggleArrayFilter("subtopics", value)}
        />

        <CheckboxGroup
          className="region-filter"
          legend="Regions"
          options={regions.map((region) => ({ value: region, label: region }))}
          selected={filters.regions}
          onToggle={(value) => toggleArrayFilter("regions", value)}
        />

        <CheckboxGroup
          className="country-filter"
          legend="Countries"
          options={countries.map((country) => ({ value: country, label: country }))}
          selected={filters.countries}
          onToggle={(value) => toggleArrayFilter("countries", value)}
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

function CheckboxGroup({
  className,
  legend,
  options,
  selected,
  onToggle
}: {
  className: string;
  legend: string;
  options: CheckboxOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className={`multi-filter-field ${className}`}>
      <legend>{legend}</legend>
      <div className="checkbox-chip-grid">
        {options.map((option) => (
          <label className="checkbox-chip" key={option.value}>
            <input
              checked={selected.includes(option.value)}
              type="checkbox"
              onChange={() => onToggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
