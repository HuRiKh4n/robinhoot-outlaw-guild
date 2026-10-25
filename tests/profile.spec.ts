import { choose, selected } from './creator-helpers';
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
  await page.goto('/my-outlaw');
  await expect(nameInput(page)).toBeEnabled();
  await nameInput(page).fill('Guest Fox');
  await choose(page, 'SPECIES', 'Fox');
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Guest Fox');
  await connectWeb(page);
  await expect(page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  await nameInput(page).fill('Alpha Ranger');
  await choose(page, 'CLASS', 'Ranger');
  await choose(page, 'SPECIES', 'Wolf');
  await choose(page, 'OUTFIT', 'Forest Hood');
  await choose(page, 'PERSONALITY', 'Fearless');
  const profile = page.getByRole('region', { name: 'WHERE YOUR OUTLAW LIVES', exact: true });
  await expect(page.locator('.poster')).toContainText('Alpha Ranger');
  for (const text of ['Ranger', 'Wolf', 'Forest Hood']) await expect(page.locator('.poster')).toContainText(text);
  await expect(profile).toContainText('saved only in this browser');
  await expect(profile).toContainText('Each wallet keeps its own outlaw');
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Alpha Ranger');
  await reconnect(page, 'alpha.near');
  await expect(page.getByRole('button', { name: 'Wallet connected: beta.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  await nameInput(page).fill('Beta Trickster');
  await choose(page, 'CLASS', 'Trickster');
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Beta Trickster');
  await reconnect(page, 'beta.near');
  await expect(page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true })).toBeEnabled();
  await expect(nameInput(page)).toHaveValue('Alpha Ranger');
  await selected(page, 'CLASS', 'Ranger');
  await page.getByRole('button', { name: 'Wallet connected: alpha.near. Manage wallet', exact: true }).click();
  await page.getByRole('button', { name: 'DISCONNECT WALLET', exact: true }).click();
  await expect(nameInput(page)).toHaveValue('Guest Fox');
  await selected(page, 'SPECIES', 'Fox');
  await expect(page.getByText('NO WALLET · GUEST OUTLAW', { exact: true })).toBeVisible();
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
  await page.locator('nav').first().screenshot({ path: testInfo.outputPath('mobile-header.png') });
  for (const name of ['The Tale', 'Your Outlaw', 'Bounties']) await expect(page.locator('nav').first().getByRole('link', { name, exact: true })).toBeVisible();
});

test('malformed local data cannot create membership or replace allowed creator choices', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('robinhoot:outlaw-draft', JSON.stringify({
    name: 'Local Imposter', class: 'Admin', species: 'Dragon', outfit: 'Crown', personality: 'Verified', reputation: 99999, member: true,
  })));
  await page.goto('/my-outlaw');
  await expect(nameInput(page)).toHaveValue('Local Imposter');
  await selected(page, 'CLASS', 'Ranger');
  await selected(page, 'SPECIES', 'Wolf');
  await expect(page.getByRole('region', { name: 'WHERE YOUR OUTLAW LIVES', exact: true })).toContainText('doesn’t prove anything, register anything or earn anything');
  await nameInput(page).fill('Valid Local Draft');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!))).toEqual({ name: 'Valid Local Draft', class: 'Ranger', species: 'Wolf', outfit: 'Patched Cloak', personality: 'Cunning' });
});

test('explicit guest copy preserves the full character across a new browser session without another wallet request', async ({ page, context, browser }, testInfo) => {
  await mockMeteorWeb(context, ['identity.near']);
  await page.goto('/my-outlaw');
  await nameInput(page).fill('Persistent Wolf');
  await choose(page, 'SPECIES', 'Wolf'); await choose(page, 'CLASS', 'Warrior');
  await choose(page, 'OUTFIT', 'Royal Guard'); await choose(page, 'PERSONALITY', 'Loyal');
  const guest = await page.evaluate(() => sessionStorage.getItem('robinhoot:outlaw-draft'));
  await connectWeb(page);
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  const copy = page.getByRole('button', { name: 'BRING MY GUEST OUTLAW', exact: true });
  await expect(copy).toBeVisible();
  await page.setViewportSize({width:320,height:851});
  const box = await copy.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(48);
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.locator('.controls').screenshot({path:testInfo.outputPath('guest-character-account-copy.png')});
  await copy.click();
  await expect(nameInput(page)).toHaveValue('Persistent Wolf');
  await expect(copy).toHaveCount(0);
  await expect(page.getByText('Saved locally on this browser for this account only.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('robinhoot:outlaw-draft'))).toBe(guest);
  const state = await context.storageState();
  const resumed = await browser.newContext({ storageState: state, viewport: page.viewportSize()!, isMobile: testInfo.project.name === 'android', hasTouch: testInfo.project.name === 'android' });
  try {
    await mockMeteorWeb(resumed, []);
    const next = await resumed.newPage(); await next.goto('http://127.0.0.1:3000/my-outlaw');
    await expect(next.getByRole('button', { name: 'Wallet connected: identity.near. Manage wallet', exact: true })).toBeEnabled();
    await expect(nameInput(next)).toHaveValue('Persistent Wolf');
    for (const [field, value] of [['SPECIES','Wolf'],['CLASS','Warrior'],['OUTFIT','Royal Guard'],['PERSONALITY','Loyal']]) await selected(next, field, value);
    await expect(next.locator('.character-preview-large img')).toHaveAttribute('src', '/characters/wolf/warrior/royal-guard.png');
    await expect(next.locator('.poster')).toContainText('Royal Guard');
    await expect(next.locator('.passport canvas')).toHaveAttribute('aria-label', /Persistent Wolf, Warrior, Wolf, Royal Guard, Loyal/);
    await expect(next.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT', exact: true })).toBeEnabled();
    expect(await next.evaluate(() => sessionStorage.getItem('robinhoot:outlaw-draft'))).toBeNull();
    expect(await next.evaluate(() => Reflect.get(window, '__meteorRequests'))).toEqual([]);
    const stored = await next.evaluate(() => JSON.parse(localStorage.getItem('robinhoot:profile:v1:mainnet:identity.near')!));
    expect(stored).toEqual({ name:'Persistent Wolf', species:'Wolf', class:'Warrior', outfit:'Royal Guard', personality:'Loyal' });
  } finally { await resumed.close(); }
});

test('guest copy fails honestly on storage errors and never replaces an existing account draft', async ({ page, context }) => {
  await mockMeteorWeb(context, ['protected.near']);
  await page.goto('/my-outlaw'); await nameInput(page).fill('Guest Original');
  await connectWeb(page);
  const copy = page.getByRole('button', { name:'BRING MY GUEST OUTLAW', exact:true });
  await expect(copy).toBeVisible();
  await page.evaluate(() => {
    Reflect.set(window, '__originalStorageSet', Storage.prototype.setItem);
    Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  await copy.click();
  await expect(page.getByText('Could not save locally:', { exact:false })).toBeVisible();
  await expect(nameInput(page)).toHaveValue('The Broke Bandit');
  expect(await page.evaluate(() => localStorage.getItem('robinhoot:profile:v1:mainnet:protected.near'))).toBeNull();
  await page.evaluate(() => {
    Storage.prototype.setItem = Reflect.get(window, '__originalStorageSet');
    localStorage.setItem('robinhoot:profile:v1:mainnet:protected.near', JSON.stringify({name:'Existing Owner Draft',species:'Wolf',class:'Mage',outfit:'Mystic Hood',personality:'Fearless'}));
  });
  await copy.click();
  await expect(page.getByText('This account already has a saved draft.', { exact:false })).toBeVisible();
  await page.reload();
  await expect(nameInput(page)).toHaveValue('Existing Owner Draft');
  await expect(copy).toHaveCount(0);
  await selected(page,'OUTFIT','Mystic Hood');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!).name)).toBe('Guest Original');
});
