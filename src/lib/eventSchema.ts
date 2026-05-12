import type { EventRecord, Taxonomy, ValidationResult } from "./eventTypes";

const EVENT_ID_PATTERN = /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const REPOSITORY_ATTACHMENT_PATTERN =
  /^data\/attachments\/\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9][a-z0-9._-]*$/;

const eventModes = new Set(["in-person", "online", "hybrid"]);
const feeTypes = new Set(["free", "paid", "unknown"]);

type ValidationOptions = {
  attachmentExists?: (path: string) => boolean;
};

export function createEventSlug(name: string, startDate: string): string {
  const year = validDate(startDate) ? startDate.slice(0, 4) : new Date().getUTCFullYear().toString();
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return `${year}-${slug || "event"}`;
}

export function validateEvent(
  candidate: unknown,
  taxonomy: Taxonomy,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return { ok: false, errors: ["Event must be a JSON object."] };
  }

  requireNonEmptyString(candidate, "id", errors);
  requireNonEmptyString(candidate, "name", errors);
  requireNonEmptyString(candidate, "description", errors);
  requireNonEmptyString(candidate, "website", errors);
  requireNonEmptyString(candidate, "location", errors);
  requireNonEmptyString(candidate, "mode", errors);
  requireNonEmptyString(candidate, "startDate", errors);
  requireNonEmptyString(candidate, "createdAt", errors);
  requireNonEmptyString(candidate, "updatedAt", errors);

  if (typeof candidate.id === "string" && !EVENT_ID_PATTERN.test(candidate.id)) {
    errors.push("id must use the format YYYY-lowercase-slug.");
  }

  if (typeof candidate.website === "string" && !validUrl(candidate.website)) {
    errors.push("website must be a valid http(s) URL.");
  }

  if (typeof candidate.mode === "string" && !eventModes.has(candidate.mode)) {
    errors.push("mode must be one of in-person, online, or hybrid.");
  }

  validateDateField(candidate, "startDate", errors);
  validateDateField(candidate, "endDate", errors, true);
  validateDateField(candidate, "applicationDeadline", errors, true);
  validateTimestampField(candidate, "createdAt", errors);
  validateTimestampField(candidate, "updatedAt", errors);

  if (
    typeof candidate.startDate === "string" &&
    typeof candidate.endDate === "string" &&
    validDate(candidate.startDate) &&
    validDate(candidate.endDate) &&
    candidate.endDate < candidate.startDate
  ) {
    errors.push("endDate must be on or after startDate.");
  }

  if (
    typeof candidate.startDate === "string" &&
    typeof candidate.applicationDeadline === "string" &&
    validDate(candidate.startDate) &&
    validDate(candidate.applicationDeadline) &&
    candidate.applicationDeadline > candidate.startDate
  ) {
    errors.push("applicationDeadline must be on or before startDate.");
  }

  if (
    typeof candidate.startDate === "string" &&
    typeof candidate.applicationDeadline === "string" &&
    !validDate(candidate.startDate) &&
    validDate(candidate.applicationDeadline)
  ) {
    errors.push("applicationDeadline cannot be checked until startDate is valid.");
  }

  validateFee(candidate.fee, errors);
  validateTaxonomy(candidate, taxonomy, errors);
  validateAttachments(candidate.attachments, errors, options);

  return { ok: errors.length === 0, errors };
}

export function validateEventCollection(
  events: unknown[],
  taxonomy: Taxonomy,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  events.forEach((event, index) => {
    const result = validateEvent(event, taxonomy, options);
    errors.push(...result.errors.map((error) => `Event ${index + 1}: ${error}`));

    if (isRecord(event) && typeof event.id === "string") {
      if (seenIds.has(event.id)) {
        errors.push(`Duplicate event id: ${event.id}.`);
      }
      seenIds.add(event.id);
    }
  });

  return { ok: errors.length === 0, errors };
}

export function isEventRecord(candidate: unknown, taxonomy: Taxonomy): candidate is EventRecord {
  return validateEvent(candidate, taxonomy).ok;
}

function validateTaxonomy(candidate: Record<string, unknown>, taxonomy: Taxonomy, errors: string[]) {
  const macrotopicIds = new Set(taxonomy.macrotopics.map((topic) => topic.id));
  const subtopicIds = new Set(taxonomy.macrotopics.flatMap((topic) => topic.subtopics.map((sub) => sub.id)));

  if (!Array.isArray(candidate.macrotopics) || candidate.macrotopics.length === 0) {
    errors.push("macrotopics must contain at least one approved macrotopic id.");
  } else {
    for (const macrotopic of candidate.macrotopics) {
      if (typeof macrotopic !== "string" || !macrotopicIds.has(macrotopic)) {
        errors.push(`Unknown macrotopic: ${String(macrotopic)}.`);
      }
    }
  }

  if (!Array.isArray(candidate.subtopics) || candidate.subtopics.length === 0) {
    errors.push("subtopics must contain at least one approved subtopic id.");
  } else {
    for (const subtopic of candidate.subtopics) {
      if (typeof subtopic !== "string" || !subtopicIds.has(subtopic)) {
        errors.push(`Unknown subtopic: ${String(subtopic)}.`);
      }
    }
  }
}

function validateFee(fee: unknown, errors: string[]) {
  if (!isRecord(fee)) {
    errors.push("fee must be an object.");
    return;
  }

  if (typeof fee.type !== "string" || !feeTypes.has(fee.type)) {
    errors.push("fee.type must be free, paid, or unknown.");
  }

  if ("amount" in fee && (typeof fee.amount !== "number" || fee.amount < 0)) {
    errors.push("fee.amount must be a non-negative number when provided.");
  }

  if ("currency" in fee && (typeof fee.currency !== "string" || !/^[A-Z]{3}$/.test(fee.currency))) {
    errors.push("fee.currency must be a three-letter ISO currency code when provided.");
  }

  if ("notes" in fee && typeof fee.notes !== "string") {
    errors.push("fee.notes must be a string when provided.");
  }
}

function validateAttachments(
  attachments: unknown,
  errors: string[],
  options: ValidationOptions
) {
  if (!Array.isArray(attachments)) {
    errors.push("attachments must be an array.");
    return;
  }

  attachments.forEach((attachment, index) => {
    if (!isRecord(attachment)) {
      errors.push(`attachment ${index + 1} must be an object.`);
      return;
    }

    requireNonEmptyString(attachment, "label", errors, `attachment ${index + 1}`);

    if (attachment.type === "external") {
      if (typeof attachment.url !== "string" || !validUrl(attachment.url)) {
        errors.push(`external attachment ${index + 1} must include a valid http(s) URL.`);
      }
      return;
    }

    if (attachment.type === "repository") {
      if (
        typeof attachment.path !== "string" ||
        !REPOSITORY_ATTACHMENT_PATTERN.test(attachment.path)
      ) {
        errors.push(
          `repository attachment ${index + 1} must use data/attachments/<event-id>/<file-name>.`
        );
        return;
      }

      if (options.attachmentExists && !options.attachmentExists(attachment.path)) {
        errors.push(`repository attachment ${index + 1} points to a missing file: ${attachment.path}.`);
      }
      return;
    }

    errors.push(`attachment ${index + 1} type must be external or repository.`);
  });
}

function validateDateField(
  candidate: Record<string, unknown>,
  field: string,
  errors: string[],
  optional = false
) {
  const value = candidate[field];

  if (value === undefined && optional) {
    return;
  }

  if (typeof value !== "string" || !validDate(value)) {
    errors.push(`${field} must be a valid YYYY-MM-DD date.`);
  }
}

function validateTimestampField(candidate: Record<string, unknown>, field: string, errors: string[]) {
  const value = candidate[field];
  if (typeof value !== "string" || !ISO_TIMESTAMP_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${field} must be an ISO timestamp ending in Z.`);
  }
}

function requireNonEmptyString(
  candidate: Record<string, unknown>,
  field: string,
  errors: string[],
  label = "event"
) {
  if (typeof candidate[field] !== "string" || candidate[field].trim() === "") {
    errors.push(`${label} ${field} must be a non-empty string.`);
  }
}

function validDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}
