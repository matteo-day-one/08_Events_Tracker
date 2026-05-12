import { Copy, Github, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { repositoryUrl } from "../config";
import type { EventRecord, FeeInfo } from "../lib/eventTypes";
import { createEventSlug, validateEvent } from "../lib/eventSchema";
import { buildGitHubIssueUrl, formatProposalMarkdown, type EventProposal } from "../lib/proposals";
import { taxonomy } from "../lib/taxonomy";

type ProposalDrawerProps = {
  events: EventRecord[];
  mode: ProposalMode;
  selectedEvent: EventRecord;
  onClose: () => void;
};

export type ProposalMode = "add" | "update" | "delete";

type EventFormState = {
  name: string;
  website: string;
  location: string;
  description: string;
  mode: EventRecord["mode"];
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  feeType: FeeInfo["type"];
  feeAmount: string;
  feeCurrency: string;
  feeNotes: string;
  macrotopics: string;
  subtopics: string;
  externalAttachmentLabel: string;
  externalAttachmentUrl: string;
  repositoryAttachmentLabel: string;
  repositoryAttachmentPath: string;
  reason: string;
};

const proposalTitle: Record<ProposalMode, string> = {
  add: "Add event proposal",
  update: "Update event proposal",
  delete: "Delete event proposal"
};

const proposalActionLabel: Record<ProposalMode, string> = {
  add: "Add",
  update: "Update",
  delete: "Delete"
};

export function ProposalDrawer({ events, mode, selectedEvent, onClose }: ProposalDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [targetEventId, setTargetEventId] = useState(selectedEvent.id);
  const [form, setForm] = useState<EventFormState>(() =>
    mode === "add" ? blankForm() : blankForm(selectedEvent)
  );

  useEffect(() => {
    setTargetEventId(selectedEvent.id);
    setForm(mode === "add" ? blankForm() : blankForm(selectedEvent));
  }, [mode, selectedEvent]);

  useEffect(() => {
    document.body.classList.add("proposal-drawer-open");
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("proposal-drawer-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const targetEvent = events.find((event) => event.id === targetEventId) ?? selectedEvent;

  const proposal = useMemo(
    () => buildProposal(mode, targetEvent, form),
    [form, mode, targetEvent]
  );

  const validation = useMemo(() => {
    if (!proposal || proposal.action === "delete") {
      return { ok: true, errors: [] };
    }

    return validateEvent(proposal.event, taxonomy);
  }, [proposal]);

  const markdown = proposal
    ? formatProposalMarkdown(proposal)
    : "Complete the required fields to generate a proposal.";
  const issueUrl = proposal
    ? buildGitHubIssueUrl({ repositoryUrl, proposal })
    : `${repositoryUrl}/issues/new`;

  const updateForm = (key: keyof EventFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const chooseTarget = (nextEventId: string) => {
    setTargetEventId(nextEventId);
    const nextTarget = events.find((event) => event.id === nextEventId);
    if (nextTarget && mode === "update") {
      setForm(blankForm(nextTarget));
    }
  };

  const copyProposal = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(markdown);
    }
  };

  return (
    <div className="proposal-drawer-layer">
      <button
        aria-label="Close drawer backdrop"
        className="proposal-backdrop"
        type="button"
        onClick={onClose}
      />
      <aside
        aria-labelledby="proposal-drawer-title"
        aria-modal="true"
        className="proposal-drawer"
        role="dialog"
      >
        <div className="proposal-drawer-header">
          <div>
            <span className="drawer-kicker">{proposalActionLabel[mode]} proposal</span>
            <h2 id="proposal-drawer-title">{proposalTitle[mode]}</h2>
          </div>
          <button
            aria-label="Close proposal drawer"
            className="icon-button secondary icon-only"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="proposal-drawer-body">
          <section className="proposal-section" aria-label="Action and target">
            <div className="proposal-meta-grid">
              <div>
                <span>Action</span>
                <strong>{proposalActionLabel[mode]}</strong>
              </div>
              {mode !== "add" ? (
                <label className="form-field">
                  <span>Target event</span>
                  <select value={targetEventId} onChange={(event) => chooseTarget(event.target.value)}>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div>
                  <span>Target event</span>
                  <strong>New event</strong>
                </div>
              )}
            </div>
          </section>

          {mode === "delete" ? (
            <section className="proposal-section" aria-label="Reason">
              <h3>Reason</h3>
              <label className="form-field">
                <span>Reason for proposal</span>
                <textarea
                  value={form.reason}
                  onChange={(event) => updateForm("reason", event.target.value)}
                  rows={4}
                />
              </label>
            </section>
          ) : (
            <EventProposalForm form={form} onChange={updateForm} />
          )}

          {!validation.ok ? (
            <div className="validation-box" role="alert">
              <strong>Validation</strong>
              <ul>
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="proposal-output" data-testid="proposal-output">
            <div className="proposal-output-header">
              <h2>Generated proposal output</h2>
              <div>
                <button className="icon-button secondary" type="button" onClick={copyProposal}>
                  <Copy aria-hidden="true" size={15} />
                  Copy
                </button>
                <a className="icon-button primary" href={issueUrl} target="_blank" rel="noreferrer">
                  <Github aria-hidden="true" size={15} />
                  GitHub issue
                </a>
              </div>
            </div>
            <textarea readOnly value={markdown} rows={12} aria-label="Generated proposal markdown" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function EventProposalForm({
  form,
  onChange
}: {
  form: EventFormState;
  onChange: (key: keyof EventFormState, value: string) => void;
}) {
  const subtopics = taxonomy.macrotopics.flatMap((topic) => topic.subtopics);

  return (
    <div className="proposal-form">
      <section className="proposal-section" aria-label="Event basics">
        <h3>Event basics</h3>
        <div className="proposal-field-grid">
          <label className="form-field">
            <span>Event name</span>
            <input value={form.name} onChange={(event) => onChange("name", event.target.value)} />
          </label>
          <label className="form-field">
            <span>Website</span>
            <input
              type="url"
              value={form.website}
              onChange={(event) => onChange("website", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Location</span>
            <input value={form.location} onChange={(event) => onChange("location", event.target.value)} />
          </label>
          <label className="form-field">
            <span>Mode</span>
            <select value={form.mode} onChange={(event) => onChange("mode", event.target.value)}>
              <option value="in-person">In person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="form-field full-span">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              rows={4}
            />
          </label>
        </div>
      </section>

      <section className="proposal-section" aria-label="Schedule">
        <h3>Schedule</h3>
        <div className="proposal-field-grid">
          <label className="form-field">
            <span>Start date</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => onChange("startDate", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>End date</span>
            <input type="date" value={form.endDate} onChange={(event) => onChange("endDate", event.target.value)} />
          </label>
          <label className="form-field">
            <span>Application deadline</span>
            <input
              type="date"
              value={form.applicationDeadline}
              onChange={(event) => onChange("applicationDeadline", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="proposal-section" aria-label="Topics and fee">
        <h3>Topics and fee</h3>
        <div className="proposal-field-grid">
          <label className="form-field">
            <span>Macrotopics</span>
            <select value={form.macrotopics} onChange={(event) => onChange("macrotopics", event.target.value)}>
              {taxonomy.macrotopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Subtopics</span>
            <select value={form.subtopics} onChange={(event) => onChange("subtopics", event.target.value)}>
              {subtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>
                  {subtopic.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Fee</span>
            <select value={form.feeType} onChange={(event) => onChange("feeType", event.target.value)}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="form-field">
            <span>Fee amount</span>
            <input
              type="number"
              min="0"
              value={form.feeAmount}
              onChange={(event) => onChange("feeAmount", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Currency</span>
            <input value={form.feeCurrency} onChange={(event) => onChange("feeCurrency", event.target.value)} />
          </label>
          <label className="form-field">
            <span>Fee notes</span>
            <input value={form.feeNotes} onChange={(event) => onChange("feeNotes", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="proposal-section" aria-label="Files">
        <h3>Files</h3>
        <div className="proposal-field-grid">
          <label className="form-field">
            <span>External file label</span>
            <input
              value={form.externalAttachmentLabel}
              onChange={(event) => onChange("externalAttachmentLabel", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>External file URL</span>
            <input
              type="url"
              value={form.externalAttachmentUrl}
              onChange={(event) => onChange("externalAttachmentUrl", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Repository file label</span>
            <input
              value={form.repositoryAttachmentLabel}
              onChange={(event) => onChange("repositoryAttachmentLabel", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Repository file path</span>
            <input
              value={form.repositoryAttachmentPath}
              onChange={(event) => onChange("repositoryAttachmentPath", event.target.value)}
              placeholder="data/attachments/event-id/file.pdf"
            />
          </label>
        </div>
      </section>

      <section className="proposal-section" aria-label="Reason">
        <h3>Reason</h3>
        <label className="form-field full-span">
          <span>Reason for proposal</span>
          <textarea
            value={form.reason}
            onChange={(event) => onChange("reason", event.target.value)}
            rows={4}
          />
        </label>
      </section>
    </div>
  );
}

function blankForm(event?: EventRecord): EventFormState {
  return {
    name: event?.name ?? "",
    website: event?.website ?? "",
    location: event?.location ?? "",
    description: event?.description ?? "",
    mode: event?.mode ?? "hybrid",
    startDate: event?.startDate ?? "",
    endDate: event?.endDate ?? "",
    applicationDeadline: event?.applicationDeadline ?? "",
    feeType: event?.fee.type ?? "free",
    feeAmount: event?.fee.type === "paid" && event.fee.amount ? String(event.fee.amount) : "",
    feeCurrency: event?.fee.type === "paid" && event.fee.currency ? event.fee.currency : "",
    feeNotes: event?.fee.notes ?? "",
    macrotopics: event?.macrotopics[0] ?? taxonomy.macrotopics[0]?.id ?? "",
    subtopics: event?.subtopics[0] ?? taxonomy.macrotopics[0]?.subtopics[0]?.id ?? "",
    externalAttachmentLabel: "",
    externalAttachmentUrl: "",
    repositoryAttachmentLabel: "",
    repositoryAttachmentPath: "",
    reason: ""
  };
}

function buildProposal(
  mode: ProposalMode,
  targetEvent: EventRecord,
  form: EventFormState
): EventProposal | undefined {
  const reason = form.reason.trim() || "Proposed from the public event tracker.";

  if (mode === "delete") {
    return {
      action: "delete",
      targetEventId: targetEvent.id,
      reason
    };
  }

  const event = formToEvent(form, mode === "update" ? targetEvent.id : undefined);

  return mode === "update"
    ? {
        action: "update",
        targetEventId: targetEvent.id,
        reason,
        event
      }
    : {
        action: "add",
        reason,
        event
      };
}

function formToEvent(form: EventFormState, existingId?: string): EventRecord {
  const now = new Date().toISOString();
  const id = existingId ?? createEventSlug(form.name || "untitled-event", form.startDate);

  return {
    id,
    name: form.name,
    description: form.description,
    website: form.website,
    location: form.location,
    mode: form.mode,
    startDate: form.startDate,
    ...(form.endDate ? { endDate: form.endDate } : {}),
    ...(form.applicationDeadline ? { applicationDeadline: form.applicationDeadline } : {}),
    fee: buildFee(form),
    macrotopics: [form.macrotopics].filter(Boolean),
    subtopics: [form.subtopics].filter(Boolean),
    attachments: buildAttachments(form),
    createdAt: now,
    updatedAt: now
  };
}

function buildFee(form: EventFormState): FeeInfo {
  if (form.feeType === "paid") {
    return {
      type: "paid",
      ...(form.feeAmount ? { amount: Number(form.feeAmount) } : {}),
      ...(form.feeCurrency ? { currency: form.feeCurrency.toUpperCase() } : {}),
      ...(form.feeNotes ? { notes: form.feeNotes } : {})
    };
  }

  return {
    type: form.feeType,
    ...(form.feeNotes ? { notes: form.feeNotes } : {})
  } as FeeInfo;
}

function buildAttachments(form: EventFormState): EventRecord["attachments"] {
  const attachments: EventRecord["attachments"] = [];

  if (form.externalAttachmentLabel && form.externalAttachmentUrl) {
    attachments.push({
      label: form.externalAttachmentLabel,
      type: "external",
      url: form.externalAttachmentUrl
    });
  }

  if (form.repositoryAttachmentLabel && form.repositoryAttachmentPath) {
    attachments.push({
      label: form.repositoryAttachmentLabel,
      type: "repository",
      path: form.repositoryAttachmentPath
    });
  }

  return attachments;
}
