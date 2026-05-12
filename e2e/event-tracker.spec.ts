import { expect, test } from "@playwright/test";

test("browses, filters, selects details, and generates an add proposal", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Public Event Tracker" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toBeVisible();

  await page.getByLabel("Search events").fill("medical");
  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toHaveCount(0);
  await expect(page.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeVisible();

  await page.getByRole("row", { name: /Medical Robotics Workshop/ }).click();
  await expect(page.getByLabel("Selected event details")).toContainText("Medical Robotics Workshop");

  await page.getByRole("button", { name: "Propose add" }).click();
  const proposalPanel = page.getByLabel("Contribution proposals");
  await proposalPanel.getByLabel("Event name").fill("Battery Research Demo Day");
  await proposalPanel.getByLabel("Website").fill("https://example.org/battery-demo-day");
  await proposalPanel.getByLabel("Location").fill("Bologna, Italy");
  await proposalPanel
    .getByLabel("Description")
    .fill("Demo day for battery research prototypes and industrial pilots.");
  await proposalPanel.getByLabel("Start date").fill("2026-11-05");
  await proposalPanel.getByLabel("Application deadline").fill("2026-10-10");
  await proposalPanel.getByLabel("Macrotopics").selectOption("energy");
  await proposalPanel.getByLabel("Subtopics").selectOption("batteries");
  await proposalPanel.getByLabel("Reason for proposal").fill("Relevant public event for the energy community.");

  const output = proposalPanel.getByLabel("Generated proposal markdown");
  await expect(output).toContainText("Action: add");
  await expect(output).toContainText("2026-battery-research-demo-day");
  await expect(page.getByRole("link", { name: "GitHub issue" })).toHaveAttribute(
    "href",
    /issues\/new\?/
  );
});
