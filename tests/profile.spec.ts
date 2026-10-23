import { expect, test, type Page } from '@playwright/test';
import { mockMeteorWeb, openMeteor } from './helpers';

async function connectWeb(page: Page) {
  await openMeteor(page);
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
}
async function reconnect(page: Page, accountId: string) {
  await page.getByRole('button', { name: `Wallet connected: ${accountId}. Manage wallet`, exact: true }).click();
  await page.getByRole('button', { name: 'SWITCH ACCOUNT', exact: true }).click();
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
}
const nameInput = (page: Page) => page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' });

test('wallet drafts stay isolated through reload, switching and disconnect', async ({ page, context }) => {
  await mockMeteorWeb(context, ['alpha.near', 'beta.near', 'alpha.near']);
  await page.goto('/');
  await expect(nameInput(page)).toBeEnabled();
  await nameInput(page).fill('Guest Fox');
  await page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true }).selectOption('Fox');
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Guest Fox');
  await connectWeb(page);
  await expect(page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  await nameInput(page).fill('Alpha Ranger');
  await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption('Ranger');
  await page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true }).selectOption('Wolf');
  await page.getByRole('combobox', { name: 'YOUR OUTFIT', exact: true }).selectOption('Ragged Hood');
  await page.getByRole('combobox', { name: 'YOUR PERSONALITY', exact: true }).selectOption('Fearless');
  await page.getByRole('link', { name: 'VIEW YOUR OUTLAW PROFILE' }).click();
  const profile = page.getByRole('region', { name: 'OUTLAW PROFILE', exact: true });
  await expect(profile.getByRole('heading', { name: 'Alpha Ranger', exact: true })).toBeVisible();
  for (const text of ['Ranger', 'Wolf', 'Ragged Hood', 'Fearless']) await expect(profile.getByText(text, { exact: true })).toBeVisible();
  await expect(profile).toContainText('NOT authenticated ownership');
  await expect(profile).toContainText('NOT registered on-chain or server-verified');
  await profile.getByRole('button', { name: 'EDIT PROFILE' }).click();
  await expect(nameInput(page)).toBeFocused();
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Alpha Ranger');
  await reconnect(page, 'alpha.near');
  await expect(page.getByRole('button', { name: 'Wallet connected: beta.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  await nameInput(page).fill('Beta Trickster');
  await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption('Trickster');
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Beta Trickster');
  await reconnect(page, 'beta.near');
  await expect(page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('Alpha Ranger');
  await expect(page.getByRole('combobox', { name: 'YOUR CLASS', exact: true })).toHaveValue('Ranger');
  await page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true }).click();
  await page.getByRole('button', { name: 'DISCONNECT WALLET', exact: true }).click();
  await expect(nameInput(page)).toHaveValue('Guest Fox');
  await expect(page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true })).toHaveValue('Fox');
  await expect(profile).toContainText('UNCONNECTED DRAFT MODE');
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Guest Fox');
  const stored = await page.evaluate(() => ({
    alpha: JSON.parse(localStorage.getItem('robinhoot:profile:v1:mainnet:alpha.near')!),
    beta: JSON.parse(localStorage.getItem('robinhoot:profile:v1:mainnet:beta.near')!),
  }));
  expect(stored.alpha.name).toBe('Alpha Ranger');
  expect(stored.beta.name).toBe('Beta Trickster');
  expect(Object.keys(stored.alpha).sort()).toEqual(['class', 'name', 'outfit', 'personality', 'species']);
});

test('long wallet accounts never wrap or overflow the responsive header', async ({ page, context }, testInfo) => {
  const accountId = '0123456789abcdef'.repeat(4);
  await mockMeteorWeb(context, [accountId]);
  await page.goto('/');
  await connectWeb(page);
  const trigger = page.getByRole('button', { name: `Wallet connected: ${accountId}. Manage wallet`, exact: true });
  await expect(trigger).toBeEnabled();
  for (const width of [320, 360, 393, 600, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await trigger.evaluate(element => {
      const label = element.querySelector('.wallet-label')!;
      const nav = element.closest('nav')!;
      const rect = element.getBoundingClientRect();
      return { whiteSpace: getComputedStyle(label).whiteSpace, height: rect.height,
        left: rect.left, right: rect.right, navScroll: nav.scrollWidth, navWidth: nav.clientWidth,
        pageScroll: document.documentElement.scrollWidth, viewport: innerWidth,
        labelHeight: label.getBoundingClientRect().height };
    });
    expect(metrics.whiteSpace).toBe('nowrap');
    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(width);
    expect(metrics.navScroll).toBeLessThanOrEqual(metrics.navWidth);
    expect(metrics.pageScroll).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.labelHeight).toBeLessThan(30);
  }
  await page.setViewportSize({ width: 393, height: 851 });
  await trigger.click();
  await expect(page.locator('.wallet-account')).toHaveText(accountId);
  await expect(page.getByRole('button', { name: 'DISCONNECT WALLET', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'VIEW YOUR OUTLAW PROFILE' }).click();
  await page.locator('#profile').screenshot({ path: testInfo.outputPath('mobile-profile.png') });
  await page.locator('nav').screenshot({ path: testInfo.outputPath('mobile-header.png') });
  await expect(page.getByRole('img', { name: 'RobinHoot — The Outlaw of NEAR', exact: true })).toBeAttached();
});

test('malformed local data cannot create membership or replace allowed creator choices', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('robinhoot:outlaw-draft', JSON.stringify({
    name: 'Local Imposter', class: 'Admin', species: 'Dragon', outfit: 'Crown', personality: 'Verified', reputation: 99999, member: true,
  })));
  await page.goto('/');
  await expect(nameInput(page)).toHaveValue('Local Imposter');
  await expect(page.getByRole('combobox', { name: 'YOUR CLASS', exact: true })).toHaveValue('Scout');
  await expect(page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true })).toHaveValue('Raccoon');
  await expect(page.getByRole('region', { name: 'OUTLAW PROFILE', exact: true })).toContainText('do not establish reputation or membership');
  await nameInput(page).fill('Valid Local Draft');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!))).toEqual({ name: 'Valid Local Draft', class: 'Scout', species: 'Raccoon', outfit: 'Patched Cloak', personality: 'Cunning' });
});
