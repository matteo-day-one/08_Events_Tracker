import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { EventRecord } from "../lib/eventTypes";
import { formatDate, formatDateRange, formatMode } from "../lib/formatters";
import {
  getMacrotopicColorClass,
  getMacrotopicLabel,
  getSubtopicColorClass,
  getSubtopicLabel
} from "../lib/taxonomy";

type TimelinePageProps = {
  events: EventRecord[];
  onSelectEvent: (event: EventRecord) => void;
};

export function TimelinePage({ events, onSelectEvent }: TimelinePageProps) {
  const groupedEvents = groupEventsByMonth(events);

  return (
    <section className="timeline-page" aria-label="Timeline page">
      <div className="page-heading">
        <h2>Timeline</h2>
        <p>{events.length} filtered events grouped by start month.</p>
      </div>

      {groupedEvents.length === 0 ? (
        <div className="empty-state">
          <h2>No events match the current filters.</h2>
          <p>Adjust filters to populate the timeline.</p>
        </div>
      ) : (
        <div className="timeline-months">
          {groupedEvents.map((group) => (
            <section className="timeline-month" key={group.monthKey}>
              <h3>{group.monthLabel}</h3>
              <ol>
                {group.events.map((event) => (
                  <li key={event.id}>
                    <button className="timeline-card" type="button" onClick={() => onSelectEvent(event)}>
                      <span className="timeline-card-date">
                        <CalendarDays aria-hidden="true" size={16} />
                        {formatDateRange(event)}
                      </span>
                      <span className="timeline-card-title">{event.name}</span>
                      <span className="timeline-card-meta">
                        <Clock aria-hidden="true" size={15} />
                        Deadline: {formatDate(event.applicationDeadline)}
                      </span>
                      <span className="timeline-card-meta">
                        <MapPin aria-hidden="true" size={15} />
                        {event.location} · {formatMode(event.mode)}
                      </span>
                      <span className="timeline-card-tags">
                        {event.macrotopics.map((id) => (
                          <span key={id} className={`topic-chip topic-chip-macro ${getMacrotopicColorClass(id)}`}>
                            {getMacrotopicLabel(id)}
                          </span>
                        ))}
                        {event.subtopics.slice(0, 4).map((id) => (
                          <span key={id} className={`topic-chip topic-chip-micro ${getSubtopicColorClass(id)}`}>
                            {getSubtopicLabel(id)}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function groupEventsByMonth(events: EventRecord[]) {
  const groups = new Map<string, EventRecord[]>();

  for (const event of events) {
    const monthKey = event.startDate.slice(0, 7);
    groups.set(monthKey, [...(groups.get(monthKey) ?? []), event]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, groupEvents]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      events: groupEvents.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name))
    }));
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return new Intl.DateTimeFormat("en", {
    month: "long",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)));
}
