import { Github } from "lucide-react";
import { useMemo, useState } from "react";
import { EventDetails } from "./components/EventDetails";
import { EventTable } from "./components/EventTable";
import { FilterBar } from "./components/FilterBar";
import { ProposalPanel } from "./components/ProposalPanel";
import { repositoryUrl } from "./config";
import { events } from "./generated/eventIndex";
import { defaultFilters, defaultSort, filterEvents, sortEvents, type EventFilters, type SortState } from "./lib/eventFilters";

export default function App() {
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id);

  const visibleEvents = useMemo(() => sortEvents(filterEvents(events, filters), sort), [filters, sort]);
  const selectedEvent =
    visibleEvents.find((event) => event.id === selectedEventId) ??
    events.find((event) => event.id === selectedEventId) ??
    visibleEvents[0] ??
    events[0];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Public Event Tracker</h1>
          <p>{events.length} reviewed events · GitHub proposals</p>
        </div>
        <a className="icon-button primary" href={repositoryUrl} target="_blank" rel="noreferrer">
          <Github aria-hidden="true" size={17} />
          Repository
        </a>
      </header>

      <main>
        <FilterBar
          filters={filters}
          resultCount={visibleEvents.length}
          totalCount={events.length}
          onFiltersChange={setFilters}
        />

        <section className="workspace-grid" aria-label="Event workspace">
          <div className="directory-panel">
            <EventTable
              events={visibleEvents}
              selectedEventId={selectedEvent?.id}
              sort={sort}
              onSortChange={setSort}
              onSelectEvent={(event) => setSelectedEventId(event.id)}
            />
          </div>

          {selectedEvent ? <EventDetails event={selectedEvent} /> : null}
        </section>

        {selectedEvent ? <ProposalPanel events={events} selectedEvent={selectedEvent} /> : null}
      </main>
    </div>
  );
}
