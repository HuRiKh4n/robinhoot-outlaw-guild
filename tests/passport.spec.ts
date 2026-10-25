import { choose, selected } from './creator-helpers';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mockMeteorWeb, openMeteor } from './helpers';

const nameInput = (page: import('@playwright/test').Page) => page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' });
const card = (page: import('@playwright/test').Page) => page.getByRole('img', { name: /^Guild Passport preview/ });

test('keyboard navigation opens My Outlaw and exports the exact preview as a PNG', async ({ page }, testInfo) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'FORGE YOUR OUTLAW →', exact: true }).first();
  await link.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/my-outlaw$/);
  await expect(page.getByRole('heading', { name: 'YOUR OUTLAW', exact: true })).toBeVisible();
  await nameInput(page).fill('Forest Fox');
  await expect(nameInput(page)).toHaveValue('Forest Fox');
  await expect(page.getByText('NO WALLET · GUEST OUTLAW', { exact: true })).toBeVisible();
  await choose(page, 'CLASS', 'Trickster');
  await choose(page, 'SPECIES', 'Fox');
  await expect(card(page)).toHaveAttribute('aria-label', /Forest Fox, Trickster, Fox/);
  await expect(page.getByText('Preview / Not minted / Not registered', { exact: true })).toBeVisible();
  const downloadLink = page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT' });
  await expect(downloadLink).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await downloadLink.focus(); await page.keyboard.press('Enter');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('robinhoot-passport-preview.png');
  const path = testInfo.outputPath('passport.png'); await download.saveAs(path);
  const png = await readFile(path);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(840); expect(png.readUInt32BE(20)).toBe(1120);
  expect(png.length).toBeGreaterThan(10000);
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Forest Fox');
  await selected(page, 'CLASS', 'Trickster');
  await expect(page.getByText('saved only in this browser', { exact: false })).toBeVisible();
});

test('passport drafts and account opt-in stay isolated when switching and disconnecting', async ({ page, context }) => {
  await mockMeteorWeb(context, ['alpha.near', 'beta.near', 'alpha.near']);
  await page.goto('/my-outlaw');
  await expect(page.getByText('Every outlaw starts as a stranger.', { exact: true })).toBeVisible();
  await nameInput(page).fill('Guest Outlaw');
  await openMeteor(page); await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(page.getByText('WALLET LINKED · SAVED ON THIS DEVICE', { exact: true })).toBeVisible();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  await nameInput(page).fill('Alpha Fox');
  await expect(card(page)).not.toHaveAttribute('aria-label', /alpha.near/);
  await page.getByRole('checkbox', { name: 'Include shortened NEAR account' }).check();
  await expect(card(page)).toHaveAttribute('aria-label', /NEAR alpha.near/);
  await page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true }).click();
  await page.getByRole('button', { name: 'SWITCH ACCOUNT', exact: true }).click();
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wallet connected: beta.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  await expect(page.getByRole('checkbox', { name: 'Include shortened NEAR account' })).not.toBeChecked();
  await expect(card(page)).not.toHaveAttribute('aria-label', /Alpha Fox|alpha.near/);
  await nameInput(page).fill('Beta Owl');
  await page.reload(); await expect(nameInput(page)).toHaveValue('Beta Owl');
  await page.getByRole('button', { name: 'Wallet connected: beta.near. Manage wallet', exact: true }).click();
  await page.getByRole('button', { name: 'SWITCH ACCOUNT', exact: true }).click();
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
  await expect(nameInput(page)).toHaveValue('Alpha Fox');
  await expect(page.getByRole('checkbox', { name: 'Include shortened NEAR account' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true }).click();
  await page.getByRole('button', { name: 'DISCONNECT WALLET', exact: true }).click();
  await expect(nameInput(page)).toHaveValue('Guest Outlaw');
  await expect(card(page)).not.toHaveAttribute('aria-label', /Alpha Fox|Beta Owl|alpha.near|beta.near/);
  await expect(page.getByRole('checkbox', { name: 'Include shortened NEAR account' })).toHaveCount(0);
});

test('share cancellation and unavailable clipboard have a keyboard-accessible fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
  });
  await page.goto('/my-outlaw');
  await nameInput(page).fill('Copy Bandit');
  const share = page.getByRole('button', { name: 'SHARE / COPY DETAILS' });
  await share.click(); await expect(page.getByText('Sharing cancelled.', { exact: true })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }));
  await share.focus(); await page.keyboard.press('Enter');
  const text = page.getByRole('textbox', { name: 'Passport text to copy' });
  await expect(text).toBeFocused();
  await expect(text).toHaveValue(/Copy Bandit[\s\S]*NOT MINTED \/ NOT REGISTERED/);
  await expect(text).toHaveValue(/not proof of ownership or authentication/);
});

test('passport handles blank names and narrow viewports', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  await nameInput(page).fill('');
  await expect(card(page)).toHaveAttribute('aria-label', /UNKNOWN OUTLAW/);
  await expect(page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT' })).toBeVisible();
  await nameInput(page).fill('W'.repeat(32));
  for (const width of [320, 393, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const box = await card(page).boundingBox(); expect(box!.width).toBeGreaterThan(0); expect(box!.width).toBeLessThan(width);
  }
  await page.setViewportSize({ width: 393, height: 851 });
  await page.locator('.passport').screenshot({ path: testInfo.outputPath('mobile-passport.png') });
});

test('unavailable canvas export falls back to copying explicit preview details', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => Object.assign(window, { __copiedPassport: text }) } });
  });
  await page.goto('/my-outlaw');
  await nameInput(page).fill('Native Fallback');
  await expect(page.getByText('Image download is unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT' })).toBeDisabled();
  await page.getByRole('button', { name: 'SHARE / COPY DETAILS' }).click();
  await expect(page.getByText('Passport details copied.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __copiedPassport: string }).__copiedPassport)).toContain('PREVIEW / NOT MINTED / NOT REGISTERED');
});
