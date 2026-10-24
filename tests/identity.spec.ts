import { test, expect } from "@playwright/test";

test("unconfigured identity is explicitly unavailable and cannot register from a local draft or account ID", async ({
  page,
  context,
}) => {
  await page.goto("/my-outlaw");
  await page
    .getByRole("textbox", { name: "YOUR OUTLAW NAME" })
    .fill("Still Local");
  await page
    .getByRole("link", { name: "GUILD IDENTITY FOUNDATION →", exact: true })
    .click();
  await expect(
    page.getByText("SERVER IDENTITY NOT CONFIGURED", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Persistent registration is not operational on this deployment.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "VERIFY WALLET OWNERSHIP", exact: true }),
  ).toHaveCount(0);
  for (const [action, method] of [
    ["challenge", "POST"],
    ["verify", "POST"],
    ["session", "GET"],
    ["character", "GET"],
    ["character", "PUT"],
  ] as const) {
    const response = await page.request.fetch(`/api/guild/${action}`, {
      method,
      ...(method !== "GET"
        ? { data: { accountId: "imposter.near", draft: { name: "Forged" } } }
        : {}),
    });
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
  expect(
    (await context.cookies()).some((cookie) =>
      cookie.name.startsWith("__Host-rh-guild"),
    ),
  ).toBe(false);
  await page.setViewportSize({ width: 320, height: 851 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page
    .getByRole("link", { name: "← BACK TO MY OUTLAW", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "YOUR OUTLAW NAME" }),
  ).toHaveValue("Still Local");
});
