import { describe, expect, it } from "vitest";
import { buildGitHubIssueUrl, formatProposalMarkdown } from "../src/lib/proposals";

const eventPayload = {
  id: "2026-clean-energy-summit",
  name: "Clean Energy Summit",
  description: "A forum for energy storage, grids, and industrial decarbonization.",
  website: "https://example.org/clean-energy",
  location: "Milan, Italy",
  mode: "hybrid",
  startDate: "2026-09-15",
  fee: { type: "free" },
  macrotopics: ["energy"],
  subtopics: ["batteries"],
  attachments: [],
  createdAt: "2026-05-12T08:00:00.000Z",
  updatedAt: "2026-05-12T08:00:00.000Z"
};

describe("proposal generation", () => {
  it("formats add proposals as structured markdown with JSON payload", () => {
    const markdown = formatProposalMarkdown({
      action: "add",
      reason: "New public event for the energy community.",
      event: eventPayload
    });

    expect(markdown).toContain("Action: add");
    expect(markdown).toContain("New public event for the energy community.");
    expect(markdown).toContain('"id": "2026-clean-energy-summit"');
    expect(markdown).toContain("Maintainer checklist");
  });

  it("builds a GitHub issue creation URL with encoded proposal body", () => {
    const url = buildGitHubIssueUrl({
      repositoryUrl: "https://github.com/example/events",
      proposal: {
        action: "delete",
        targetEventId: "2026-clean-energy-summit",
        reason: "Event was cancelled."
      }
    });

    expect(url).toMatch(/^https:\/\/github\.com\/example\/events\/issues\/new\?/);
    expect(decodeURIComponent(url)).toContain("Action: delete");
    expect(decodeURIComponent(url)).toContain("2026-clean-energy-summit");
  });
});
