import { expect, type BrowserContext, type Page } from '@playwright/test';

export async function mockMeteorWeb(context: BrowserContext, accountIds: string[]) {
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

export async function openMeteor(page: Page) {
  await page.getByRole('button', { name: 'CONNECT WALLET', exact: true }).click();
  await page.getByRole('button', { name: 'CONTINUE WITH METEOR WALLET' }).click();
  await expect(page.getByRole('dialog', { name: 'Meteor Connect', exact: true })).toBeVisible();
}

