import { ArrowDownUp, ExternalLink } from "lucide-react";
import type { EventRecord } from "../lib/eventTypes";
import type { SortKey, SortState } from "../lib/eventFilters";
import { formatDate, formatDateRange, formatFee, formatMode } from "../lib/formatters";
import { getMacrotopicLabel, getSubtopicLabel } from "../lib/taxonomy";

type EventTableProps = {
  events: EventRecord[];
  selectedEventId?: string;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  onSelectEvent: (event: EventRecord) => void;
};

const columns: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Event" },
  { key: "startDate", label: "Dates" },
  { key: "applicationDeadline", label: "Deadline" },
  { key: "location", label: "Location" },
  { key: "fee", label: "Fee" }
];

export function EventTable({
  events,
  selectedEventId,
  sort,
  onSortChange,
  onSelectEvent
}: EventTableProps) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <h2>No events match the current filters.</h2>
        <p>Adjust search, dates, topics, mode, or fee to expand the result set.</p>
      </div>
    );
  }

  const updateSort = (key: SortKey) => {
    onSortChange({
      key,
      direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc"
    });
  };

  return (
    <div className="table-scroll">
      <table className="event-table">
        <caption>Reviewed public event directory</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                <button type="button" onClick={() => updateSort(column.key)}>
                  {column.label}
                  <ArrowDownUp aria-hidden="true" size={14} />
                </button>
              </th>
            ))}
            <th scope="col">Mode</th>
            <th scope="col">Topics</th>
            <th scope="col">Website</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className={event.id === selectedEventId ? "selected-row" : undefined}
              onClick={() => onSelectEvent(event)}
            >
              <th scope="row">
                <button className="row-title" type="button" onClick={() => onSelectEvent(event)}>
                  <span>{event.name}</span>
                  <small>{event.id}</small>
                </button>
              </th>
              <td>{formatDateRange(event)}</td>
              <td>{formatDate(event.applicationDeadline)}</td>
              <td>{event.location}</td>
              <td>{formatFee(event.fee)}</td>
              <td>
                <span className={`mode-chip mode-${event.mode}`}>{formatMode(event.mode)}</span>
              </td>
              <td>
                <div className="topic-stack">
                  <span>{event.macrotopics.map((id) => getMacrotopicLabel(id)).join(", ")}</span>
                  <small>{event.subtopics.map((id) => getSubtopicLabel(id)).join(", ")}</small>
                </div>
              </td>
              <td>
                <a className="table-link" href={event.website} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" size={15} />
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
