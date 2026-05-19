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

test("shares multi-select topic and geography filters across timeline and map", async ({ page }) => {
  await page.goto("/");

  const filters = page.getByLabel("Event filters");
  await filters.getByRole("button", { name: "Topics All", exact: true }).click();
  await filters.getByRole("checkbox", { name: "Energy", exact: true }).check();
  await expect(filters.getByRole("button", { name: "Topics Energy", exact: true })).toBeVisible();

  await filters.getByRole("button", { name: "Location All", exact: true }).click();
  await filters.getByRole("checkbox", { name: "Europe", exact: true }).check();
  await expect(filters.getByRole("button", { name: "Location Europe", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Medical Robotics Workshop/ })).toHaveCount(0);

  await filters.getByRole("button", { name: "Topics Energy", exact: true }).click();
  await filters.getByRole("button", { name: "Clear Topics" }).click();
  await filters.getByRole("button", { name: "Show Energy subtopics", exact: true }).click();
  await filters.getByRole("checkbox", { name: "Batteries", exact: true }).check();
  await expect(filters.getByRole("button", { name: "Topics Batteries", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /European Geothermal Workshop/ })).toHaveCount(0);

  await filters.getByRole("button", { name: "Location Europe", exact: true }).click();
  await filters.getByRole("button", { name: "Clear Location" }).click();
  await filters.getByRole("button", { name: "Show Europe countries", exact: true }).click();
  await filters.getByRole("checkbox", { name: "Italy", exact: true }).check();
  await expect(filters.getByRole("button", { name: "Location Italy", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("row", { name: /Clean Energy Summit/ })).toBeVisible();

  await page.getByRole("button", { name: "Timeline", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
  await expect(page.getByText("September 2026")).toBeVisible();
  await expect(page.getByText("Clean Energy Summit")).toBeVisible();
  await expect(page.getByText("Medical Robotics Workshop")).toHaveCount(0);

  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Map", exact: true })).toBeVisible();
  await page
    .getByRole("complementary", { name: "Mappable events" })
    .getByRole("button", { name: "Clean Energy Summit", exact: true })
    .click();

  const popup = page.getByRole("dialog", { name: "Clean Energy Summit" });
  await expect(popup).toContainText("Milan, Italy");
  await expect(popup.getByRole("link", { name: "Website" })).toHaveAttribute(
    "href",
    "https://example.org/clean-energy-summit"
  );
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

  const filters = page.getByLabel("Event filters");
  await filters.getByRole("button", { name: "Topics All", exact: true }).click();
  await filters.getByRole("button", { name: "Show Energy subtopics", exact: true }).click();
  await expect(filters.getByRole("checkbox", { name: "Batteries", exact: true })).toBeVisible();

  const openMenuLayout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const menu = document.querySelector<HTMLElement>(".multi-select-menu")?.getBoundingClientRect();

    return {
      scrollWidth,
      viewportWidth,
      menuFits: Boolean(menu && menu.left >= 0 && menu.right <= viewportWidth)
    };
  });

  expect(openMenuLayout.menuFits).toBe(true);
  expect(openMenuLayout.scrollWidth).toBeLessThanOrEqual(openMenuLayout.viewportWidth);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Map", exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Mappable events" })).toBeVisible();

  const mobileMapLayout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const map = document.querySelector<HTMLElement>(".map-viewport")?.getBoundingClientRect();
    const panel = document.querySelector<HTMLElement>(".map-side-panel")?.getBoundingClientRect();

    return {
      scrollWidth,
      viewportWidth,
      stacked: Boolean(map && panel && panel.top >= map.bottom),
      mapFits: Boolean(map && map.left >= 0 && map.right <= viewportWidth),
      panelFits: Boolean(panel && panel.left >= 0 && panel.right <= viewportWidth)
    };
  });

  expect(mobileMapLayout.stacked).toBe(true);
  expect(mobileMapLayout.mapFits).toBe(true);
  expect(mobileMapLayout.panelFits).toBe(true);
  expect(mobileMapLayout.scrollWidth).toBeLessThanOrEqual(mobileMapLayout.viewportWidth);

  await page.getByRole("button", { name: "Add event" }).click();
  await expect(page.getByRole("dialog", { name: "Add event proposal" })).toBeVisible();
});
