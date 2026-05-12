import { Github } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { EventDetails } from "./components/EventDetails";
import { EventTable } from "./components/EventTable";
import { FilterBar } from "./components/FilterBar";
import { ProposalDrawer, type ProposalMode } from "./components/ProposalPanel";
import { repositoryUrl } from "./config";
import { events } from "./generated/eventIndex";
import { defaultFilters, defaultSort, filterEvents, sortEvents, type EventFilters, type SortState } from "./lib/eventFilters";

export default function App() {
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id);
  const [proposalMode, setProposalMode] = useState<ProposalMode | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const visibleEvents = useMemo(() => sortEvents(filterEvents(events, filters), sort), [filters, sort]);
  const selectedEvent =
    visibleEvents.find((event) => event.id === selectedEventId) ??
    events.find((event) => event.id === selectedEventId) ??
    visibleEvents[0] ??
    events[0];

  const openProposal = (mode: ProposalMode, opener?: HTMLElement) => {
    openerRef.current =
      opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setProposalMode(mode);
  };

  const closeProposal = () => {
    const opener = openerRef.current;
    setProposalMode(null);
    opener?.focus();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Public Event Tracker</h1>
          <p>{events.length} reviewed events · GitHub proposals</p>
        </div>
        <div className="header-actions">
          <button
            className="icon-button primary"
            type="button"
            onClick={(event) => openProposal("add", event.currentTarget)}
          >
            Add event
          </button>
          <a className="icon-button secondary" href={repositoryUrl} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" size={17} />
            Repository
          </a>
        </div>
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

          {selectedEvent ? (
            <EventDetails
              event={selectedEvent}
              onUpdate={(opener) => openProposal("update", opener)}
              onDelete={(opener) => openProposal("delete", opener)}
            />
          ) : null}
        </section>

        {selectedEvent && proposalMode ? (
          <ProposalDrawer
            events={events}
            mode={proposalMode}
            selectedEvent={selectedEvent}
            onClose={closeProposal}
          />
        ) : null}
      </main>
    </div>
  );
}
