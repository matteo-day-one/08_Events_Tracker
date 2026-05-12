import { expect, test } from "@playwright/test";

test("browses, filters, selects details, and generates drawer proposals", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Public Event Tracker" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toBeVisible();

  await page.getByLabel("Search events").fill("medical");
  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toHaveCount(0);
  await expect(page.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeVisible();

  await page.getByRole("row", { name: /Medical Robotics Workshop/ }).click();
  await expect(page.getByLabel("Selected event details")).toContainText("Medical Robotics Workshop");

  await page.getByRole("button", { name: "Add event" }).click();
  const drawer = page.getByRole("dialog", { name: "Add event proposal" });
  await drawer.getByLabel("Event name").fill("Battery Research Demo Day");
  await drawer.getByLabel("Website").fill("https://example.org/battery-demo-day");
  await drawer.getByLabel("Location").fill("Bologna, Italy");
  await drawer
    .getByLabel("Description")
    .fill("Demo day for battery research prototypes and industrial pilots.");
  await drawer.getByLabel("Start date").fill("2026-11-05");
  await drawer.getByLabel("Application deadline").fill("2026-10-10");
  await drawer.getByLabel("Macrotopics").selectOption("energy");
  await drawer.getByLabel("Subtopics").selectOption("batteries");
  await drawer.getByLabel("Reason for proposal").fill("Relevant public event for the energy community.");

  const output = drawer.getByLabel("Generated proposal markdown");
  await expect(output).toContainText("Action: add");
  await expect(output).toContainText("2026-battery-research-demo-day");
  await expect(drawer.getByRole("link", { name: "GitHub issue" })).toHaveAttribute(
    "href",
    /issues\/new\?/
  );

  await drawer.getByRole("button", { name: "Close proposal drawer" }).click();
  await expect(drawer).toHaveCount(0);

  await page.getByRole("button", { name: "Update event" }).click();
  await expect(page.getByRole("dialog", { name: "Update event proposal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Update event proposal" })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete event" }).click();
  await expect(page.getByRole("dialog", { name: "Delete event proposal" })).toBeVisible();
});

test("filter toolbar wraps without overlap on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");

  await expect(page.locator(".filter-band")).toBeVisible();

  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const boxes = Array.from(document.querySelectorAll<HTMLElement>(".filter-toolbar > *")).map(
      (element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
      }
    );
    const overlaps = boxes.some((box, index) =>
      boxes.slice(index + 1).some((other) => {
        const sameRow = box.top < other.bottom && other.top < box.bottom;
        const horizontalOverlap = box.left < other.right && other.left < box.right;
        return sameRow && horizontalOverlap;
      })
    );

    return { scrollWidth, viewportWidth, overlaps };
  });

  expect(layout.overlaps).toBe(false);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);

  await page.getByRole("button", { name: "Add event" }).click();
  await expect(page.getByRole("dialog", { name: "Add event proposal" })).toBeVisible();
});
