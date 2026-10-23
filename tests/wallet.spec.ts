import { expect, test } from '@playwright/test';

// Exercise the real Selector and adapter. Only the external wallet UI is mocked;
// no private keys or mainnet wallet credentials are used by these tests.
test('connects without permissions, restores, switches, and disconnects', async ({ page, context }) => {
  const accounts = ['first-outlaw.near', 'second-outlaw.near'];
  const requests: URL[] = [];
  await context.route('https://app.mynearwallet.com/**', route => {
    const url = new URL(route.request().url());
    requests.push(url);
    const accountId = accounts.shift();
    return route.fulfill({ contentType: 'text/html', body: `<script>
      setTimeout(() => window.opener.postMessage({ status: 'success', account_id: ${JSON.stringify(accountId)} }, 'http://127.0.0.1:3000'), 100);
    </script>` });
  });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Android Bandit');
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await page.getByRole('button', { name: 'CONTINUE WITH MYNEARWALLET' }).click();
  await expect(page.getByRole('button', { name: 'first-outlaw.near', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'first-outlaw.near', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Android Bandit');
  await page.getByRole('button', { name: 'first-outlaw.near', exact: true }).click();
  await page.getByRole('button', { name: 'SWITCH ACCOUNT', exact: true }).click();
  await expect(page.getByRole('button', { name: 'second-outlaw.near', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'second-outlaw.near', exact: true }).click();
  await page.getByRole('button', { name: 'DISCONNECT WALLET', exact: true }).click();
  await expect(page.getByRole('button', { name: 'CONNECT WALLET', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'CONNECT WALLET', exact: true })).toBeEnabled();
  expect(requests).toHaveLength(2);
  for (const request of requests) {
    expect(request.pathname).toBe('/login/');
    expect([...request.searchParams.keys()].sort()).toEqual(['failure_url', 'success_url']);
    expect(new URL(request.searchParams.get('success_url')!).origin).toBe('http://127.0.0.1:3000');
  }
  expect(await page.evaluate(() => localStorage.getItem('functionCallKey'))).toBeNull();
  await expect(page.getByRole('heading', { name: 'CREATE YOUR OUTLAW' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NOT ANOTHER CASTLE. AN OUTLAW GUILD.' })).toBeVisible();
  await expect(page.getByText('CHAPTER V', { exact: true })).toBeVisible();
});

test('recovers from a blocked popup without changing the character', async ({ page }) => {
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Still Here');
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await page.getByRole('button', { name: 'CONTINUE WITH MYNEARWALLET' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Allow popups');
  await expect(page.getByRole('button', { name: 'CONTINUE WITH MYNEARWALLET' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'CONNECT WALLET', exact: true })).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Still Here');
});

test('handles cancelled wallet handoff', async ({ page, context }) => {
  await context.route('https://app.mynearwallet.com/**', route => route.fulfill({
    contentType: 'text/html', body: '<script>setTimeout(() => window.close(), 100)</script>',
  }));
  await page.goto('/');
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await page.getByRole('button', { name: 'CONTINUE WITH MYNEARWALLET' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not completed');
  await expect(page.getByRole('button', { name: 'CONTINUE WITH MYNEARWALLET' })).toBeEnabled();
});

test('storage failure leaves the preview usable and offers setup retry', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Allow browser storage');
  await expect(page.getByRole('button', { name: 'RETRY WALLET SETUP' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Offline Outlaw');
  await expect(page.getByRole('heading', { name: 'Offline Outlaw', exact: true })).toBeVisible();
});
