import { expect, test, type Page } from "@playwright/test";

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  return errors;
}

async function gotoReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.locator("#main-content")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectSkipLinkOffscreen(page: Page) {
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toHaveCSS("opacity", "0");
  const box = await skipLink.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(0);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name} collection pages render without overflow or console errors`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = collectPageErrors(page);
    for (const route of ["/", "/opportunities", "/reports", "/runs"]) {
      await gotoReady(page, route);
      await expectNoHorizontalOverflow(page);
    }
    await gotoReady(page, "/");
    await page.screenshot({ fullPage: true, path: testInfo.outputPath(`${viewport.name}-papers.png`) });
    expect(errors).toEqual([]);
  });
}

test("paper search and evidence drill-down work", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = collectPageErrors(page);
  await gotoReady(page, "/");
  await expect(page.locator(".paper-card")).toHaveCount(4);
  await page.getByPlaceholder("Search papers, claims, or tags").fill("ambient-field");
  await expect(page.locator(".paper-card")).toHaveCount(1);
  await page.getByTitle("Clear filters").click();
  await expect(page.locator(".paper-card")).toHaveCount(4);

  await page.locator(".paper-card").first().click();
  await expectSkipLinkOffscreen(page);
  await expect(page.getByRole("heading", { name: "Experiments" })).toBeVisible();
  await expect(page.locator(".experiment-panel")).toHaveCount(1);
  await expect(page.getByText("Seed-controlled accuracy reproduction")).toBeVisible();
  await expect(page.getByText("Continuous campaign")).toBeVisible();
  await expect(page.getByText("demo-adaptive-sparsity-loop")).toBeVisible();
  await expect(page.getByText("Iteration 3")).toBeVisible();
  await expect(page.getByText("Reproduced accuracy", { exact: true })).toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("desktop-paper-detail.png") });
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("skip navigation appears for keyboard use without leaking into pointer navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoReady(page, "/");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expectSkipLinkOffscreen(page);
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS("opacity", "1");
  expect((await skipLink.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await page.mouse.click(700, 300);
  await expectSkipLinkOffscreen(page);
});

test("generic skill report and opportunity detail remain navigable on mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectPageErrors(page);
  await gotoReady(page, "/reports/report-demo-learning");
  await expect(page.getByRole("heading", { name: "[Demo] Agent memory: a mastery path" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mastery path", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await gotoReady(page, "/opportunities/opportunity-demo-001");
  await expect(page.getByRole("heading", { name: "Decisive experiment" })).toBeVisible();
  await expect(page.getByText("Kill criterion", { exact: true })).toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("mobile-opportunity-detail.png") });
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});
