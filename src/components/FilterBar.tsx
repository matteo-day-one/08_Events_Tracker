import { RotateCcw, Search } from "lucide-react";
import type { EventFilters } from "../lib/eventFilters";
import { defaultFilters } from "../lib/eventFilters";
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

  const subtopics = taxonomy.macrotopics.flatMap((topic) => topic.subtopics);

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

        <label className="select-field">
          <span>Topic filter</span>
          <select
            value={filters.macrotopic}
            onChange={(event) => updateFilter("macrotopic", event.target.value)}
          >
            <option value="all">All topics</option>
            {taxonomy.macrotopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Subtopic filter</span>
          <select
            value={filters.subtopic}
            onChange={(event) => updateFilter("subtopic", event.target.value)}
          >
            <option value="all">All subtopics</option>
            {subtopics.map((subtopic) => (
              <option key={subtopic.id} value={subtopic.id}>
                {subtopic.label}
              </option>
            ))}
          </select>
        </label>

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
