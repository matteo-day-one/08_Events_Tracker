import type { EventRecord, FeeInfo } from "./eventTypes";

export function formatDate(value?: string): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function formatDateRange(event: EventRecord): string {
  if (!event.endDate || event.endDate === event.startDate) {
    return formatDate(event.startDate);
  }

  return `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;
}

export function formatFee(fee: FeeInfo): string {
  if (fee.type === "free") {
    return "Free";
  }

  if (fee.type === "unknown") {
    return "Unknown";
  }

  if (typeof fee.amount === "number" && fee.currency) {
    return `${fee.amount.toLocaleString("en")} ${fee.currency}`;
  }

  return "Paid";
}

export function formatMode(mode: EventRecord["mode"]): string {
  if (mode === "in-person") {
    return "In person";
  }

  if (mode === "online") {
    return "Online";
  }

  return "Hybrid";
}
