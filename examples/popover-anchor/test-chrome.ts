import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/previews/popover-anchor", { waitUntil: "networkidle" });
});

test("popover placed next to anchor", async ({ page }) => {
  test.info().snapshotSuffix = "";
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(
    page.getByRole("dialog", { name: "Team meeting" }),
  ).toBeVisible();
  // Expect the popover to be placed next to the anchor
  expect(await page.screenshot()).toMatchSnapshot();
});
