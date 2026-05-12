import type { EventRecord } from "./eventTypes";

export type ProposalAction = "add" | "update" | "delete";

export type EventProposal =
  | {
      action: "add";
      reason: string;
      event: EventRecord;
    }
  | {
      action: "update";
      targetEventId: string;
      reason: string;
      event: EventRecord;
    }
  | {
      action: "delete";
      targetEventId: string;
      reason: string;
    };

type IssueUrlInput = {
  repositoryUrl: string;
  proposal: EventProposal;
};

export function formatProposalMarkdown(proposal: EventProposal): string {
  const target = "targetEventId" in proposal ? proposal.targetEventId : proposal.event.id;
  const jsonPayload = "event" in proposal ? JSON.stringify(proposal.event, null, 2) : undefined;

  return [
    "## Event change proposal",
    "",
    `Action: ${proposal.action}`,
    `Target event id: ${target}`,
    "",
    "### Reason",
    "",
    proposal.reason.trim(),
    "",
    "### Proposed event payload",
    "",
    jsonPayload ? ["```json", jsonPayload, "```"].join("\n") : "_No event payload is required for delete proposals._",
    "",
    "### Maintainer checklist",
    "",
    "- [ ] Validate event data locally with `npm run validate:data`.",
    "- [ ] Confirm taxonomy tags are approved.",
    "- [ ] Confirm external links and repository attachments are safe and relevant.",
    "- [ ] Convert this proposal into a reviewed pull request if accepted."
  ].join("\n");
}

export function buildGitHubIssueUrl({ repositoryUrl, proposal }: IssueUrlInput): string {
  const normalizedRepositoryUrl = repositoryUrl.replace(/\/+$/, "");
  const params = [
    ["title", proposalTitle(proposal)],
    ["labels", "event-proposal"],
    ["body", formatProposalMarkdown(proposal)]
  ]
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return `${normalizedRepositoryUrl}/issues/new?${params}`;
}

function proposalTitle(proposal: EventProposal): string {
  if (proposal.action === "add") {
    return `Add event: ${proposal.event.name}`;
  }

  if (proposal.action === "update") {
    return `Update event: ${proposal.targetEventId}`;
  }

  return `Delete event: ${proposal.targetEventId}`;
}
