import { CalendarDays, ExternalLink, FileText, MapPin, Pencil, Tag, Trash2 } from "lucide-react";
import type { EventRecord } from "../lib/eventTypes";
import { formatDate, formatDateRange, formatFee, formatMode } from "../lib/formatters";
import { getMacrotopicLabel, getSubtopicLabel } from "../lib/taxonomy";

type EventDetailsProps = {
  event: EventRecord;
  onUpdate: (opener: HTMLElement) => void;
  onDelete: (opener: HTMLElement) => void;
};

export function EventDetails({ event, onUpdate, onDelete }: EventDetailsProps) {
  return (
    <aside className="detail-panel" aria-label="Selected event details">
      <div className="detail-header">
        <p className="detail-id">{event.id}</p>
        <h2>{event.name}</h2>
      </div>

      <p className="detail-description">{event.description}</p>

      <dl className="detail-list">
        <div>
          <dt>
            <CalendarDays aria-hidden="true" size={16} />
            Dates
          </dt>
          <dd>{formatDateRange(event)}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays aria-hidden="true" size={16} />
            Deadline
          </dt>
          <dd>{formatDate(event.applicationDeadline)}</dd>
        </div>
        <div>
          <dt>
            <MapPin aria-hidden="true" size={16} />
            Location
          </dt>
          <dd>
            {event.location}
            {event.location.toLowerCase() !== formatMode(event.mode).toLowerCase()
              ? ` · ${formatMode(event.mode)}`
              : ""}
          </dd>
        </div>
        <div>
          <dt>
            <Tag aria-hidden="true" size={16} />
            Fee
          </dt>
          <dd>{formatFee(event.fee)}</dd>
        </div>
      </dl>

      <div className="tag-block">
        {event.macrotopics.map((id) => (
          <span key={id}>{getMacrotopicLabel(id)}</span>
        ))}
        {event.subtopics.map((id) => (
          <span key={id}>{getSubtopicLabel(id)}</span>
        ))}
      </div>

      <div className="detail-actions">
        <a className="primary-link" href={event.website} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" size={16} />
          Website
        </a>
        <button className="icon-button secondary" type="button" onClick={(event) => onUpdate(event.currentTarget)}>
          <Pencil aria-hidden="true" size={15} />
          Update event
        </button>
        <button className="icon-button secondary danger" type="button" onClick={(event) => onDelete(event.currentTarget)}>
          <Trash2 aria-hidden="true" size={15} />
          Delete event
        </button>
      </div>

      <section className="attachment-list" aria-label="Event attachments">
        <h3>Files and links</h3>
        {event.attachments.length > 0 ? (
          <ul>
            {event.attachments.map((attachment) => (
              <li key={`${attachment.type}-${attachment.label}`}>
                <FileText aria-hidden="true" size={16} />
                {attachment.type === "external" ? (
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    {attachment.label}
                  </a>
                ) : (
                  <a href={`/${attachment.path}`} target="_blank" rel="noreferrer">
                    {attachment.label}
                  </a>
                )}
                {attachment.description ? <small>{attachment.description}</small> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No files linked.</p>
        )}
      </section>
    </aside>
  );
}
