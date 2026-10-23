import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function mockMeteorWeb(context: BrowserContext, accountIds: string[]) {
  await context.addInitScript(() => {
    const capture: unknown[] = [];
    Object.assign(window, { __meteorRequests: capture });
    window.addEventListener('message', event => {
      if (event.origin === 'https://wallet.meteorwallet.app' && event.data?.__testMeteorRequest) {
        capture.push(event.data.__testMeteorRequest);
      }
    });
  });
  await context.route('https://wallet.meteorwallet.app/**', route => {
    const accountId = accountIds.shift();
    return route.fulfill({ contentType: 'text/html', body: `<script>
      let answered = false;
      addEventListener('message', event => {
        if (answered || event.origin !== 'http://127.0.0.1:3000' || event.data.status !== 'initializing') return;
        answered = true;
        const data = event.data;
        opener.postMessage({ __testMeteorRequest: JSON.parse(JSON.stringify(data)) }, event.origin);
        opener.postMessage({ uid: data.uid, status: 'closed_success', payload: { accountId: ${JSON.stringify(accountId)}, allKeys: [] } }, event.origin);
        setTimeout(() => close(), 1500);
      });
    </script>` });
  });
  // External mobile pairing is tested manually; web handoff tests must be offline.
  await context.route('https://mc.meteorwallet.app/**', route => route.abort());
}

async function openMeteor(page: Page) {
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await page.getByRole('button', { name: 'CONTINUE WITH METEOR WALLET' }).click();
  await expect(page.getByRole('dialog', { name: 'Meteor Connect', exact: true })).toBeVisible();
}

test('Meteor connects without keys or signing, restores, switches and disconnects', async ({ page, context }) => {
  await mockMeteorWeb(context, ['first-outlaw.near', 'second-outlaw.near']);
  await page.goto('/');
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Android Bandit');
  await openMeteor(page);
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
  await expect(page.getByRole('button', { name: 'first-outlaw.near', exact: true })).toBeVisible();
  // The real SDK and transport sent only account-sharing login, on mainnet.
  const firstRequests = await page.evaluate(() => (window as unknown as { __meteorRequests: unknown[] }).__meteorRequests);
  expect(firstRequests).toHaveLength(1);
  expect(firstRequests[0]).toMatchObject({ actionType: 'login', network: 'mainnet', inputs: { methods: [] } });
  expect(Object.keys((firstRequests[0] as { inputs: object }).inputs)).toEqual(['methods']);
  await page.reload();
  await expect(page.getByRole('button', { name: 'first-outlaw.near', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Android Bandit');
  await page.getByRole('button', { name: 'first-outlaw.near', exact: true }).click();
  await page.getByRole('button', { name: 'SWITCH ACCOUNT', exact: true }).click();
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
  await expect(page.getByRole('button', { name: 'second-outlaw.near', exact: true })).toBeVisible();
  const switchRequests = await page.evaluate(() => (window as unknown as { __meteorRequests: unknown[] }).__meteorRequests);
  expect(switchRequests).toHaveLength(1);
  expect(switchRequests[0]).toMatchObject({ actionType: 'login', network: 'mainnet', inputs: { methods: [] } });
  expect(Object.keys((switchRequests[0] as { inputs: object }).inputs)).toEqual(['methods']);
  // Bridge identity keys secure transport; they are not NEAR account access keys.
  const stored = await page.evaluate(() => ({
    keys: Object.keys(localStorage),
    accounts: JSON.parse(localStorage.getItem('robinhoot:meteor:met_data_accounts') || '[]'),
  }));
  expect(stored.keys.some(key => key.startsWith('_meteor_wallet') || key.includes('near-api-js:keystore'))).toBe(false);
  expect(stored.accounts).toEqual([expect.objectContaining({ publicKeys: [] })]);
  await page.getByRole('button', { name: 'second-outlaw.near', exact: true }).click();
  await page.getByRole('button', { name: 'DISCONNECT WALLET', exact: true }).click();
  await expect(page.getByRole('button', { name: 'CONNECT WALLET', exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'CONNECT WALLET', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'CREATE YOUR OUTLAW' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NOT ANOTHER CASTLE. AN OUTLAW GUILD.' })).toBeVisible();
  await expect(page.getByText('CHAPTER V', { exact: true })).toBeVisible();
});

test('blocked wallet popup can be cancelled and retried without losing the character', async ({ page, context }) => {
  await mockMeteorWeb(context, ['unused.near']);
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Still Here');
  await openMeteor(page);
  await page.getByRole('button', { name: 'Meteor Web', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'CONNECT WALLET', exact: true }).getByRole('alert')).toContainText('not completed');
  await expect(page.getByRole('button', { name: 'CONTINUE WITH METEOR WALLET' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Still Here');
});

test('closing Meteor account selection leaves the site disconnected', async ({ page, context }) => {
  await mockMeteorWeb(context, []);
  await page.goto('/');
  await openMeteor(page);
  await page.getByRole('button', { name: 'Close Meteor Connect', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'CONNECT WALLET', exact: true }).getByRole('alert')).toContainText('not completed');
  await expect(page.getByRole('button', { name: 'CONTINUE WITH METEOR WALLET' })).toBeEnabled();
});

test('storage failure leaves the preview usable and offers setup retry', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'CONNECT WALLET', exact: true }).getByRole('alert')).toContainText('Allow browser storage');
  await expect(page.getByRole('button', { name: 'RETRY WALLET SETUP' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Offline Outlaw');
  await expect(page.getByRole('heading', { name: 'Offline Outlaw', exact: true })).toBeVisible();
});

test('desktop extension uses account-only login without a wallet signing request', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name === 'android', 'Android Chrome does not support desktop extensions.');
  await context.route('https://mc.meteorwallet.app/**', route => route.abort());
  await page.addInitScript(() => {
    const requests: unknown[] = [];
    Object.assign(window, {
      __extensionRequests: requests,
      meteorCom: { sendMessageData() {}, addMessageDataListener() {}, directAction: async () => ({}) },
      meteorComV2: { version: 'v2', featureFlags: [], sendMessageDataAndRespond: async (data: { uid: string; status: string }) => {
        requests.push(JSON.parse(JSON.stringify(data)));
        return { uid: data.uid, status: 'closed_success', payload: { accountId: 'extension-outlaw.near', allKeys: [] } };
      } },
    });
  });
  await page.goto('/');
  await openMeteor(page);
  await page.getByRole('button', { name: 'Chrome Extension', exact: true }).click();
  await expect(page.getByRole('button', { name: 'extension-outlaw.near', exact: true })).toBeVisible();
  const requests = await page.evaluate(() => (window as unknown as { __extensionRequests: Array<{ actionType: string; network: string; inputs?: object }> }).__extensionRequests);
  const logins = requests.filter(request => request.inputs);
  expect(logins).toHaveLength(1);
  expect(logins[0]).toMatchObject({ actionType: 'login', network: 'mainnet', inputs: { methods: [] } });
  expect(Object.keys(logins[0].inputs!)).toEqual(['methods']);
  expect(requests.every(request => request.actionType === 'login')).toBe(true);
});
