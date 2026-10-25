import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const route of ['/', '/my-outlaw']) {
  test(`visible character download and explicit local save on ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Saved Android Fox');
    const save = page.getByRole('button', { name: 'SAVE DRAFT', exact: true });
    await expect(save).toBeVisible(); await save.focus(); await page.keyboard.press('Enter');
    await expect(page.getByText('Saved locally in this browser tab only.', { exact: false })).toBeVisible();
    const download = page.getByRole('button', { name: 'DOWNLOAD CHARACTER', exact: true });
    await expect(download).toBeEnabled();
    await expect(page.locator('.poster-group > .download-actions').getByRole('button', { name: 'DOWNLOAD CHARACTER' })).toBeVisible();
    const event = page.waitForEvent('download'); await download.click(); const file = await event;
    expect(file.suggestedFilename()).toBe('robinhoot-character.png');
    const path = testInfo.outputPath('wanted-character.png'); await file.saveAs(path);
    const bytes = await readFile(path); expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(bytes.readUInt32BE(16)).toBe(840); expect(bytes.readUInt32BE(20)).toBe(1120);
    await expect(page.getByText('Download requested.', { exact: false }).first()).toBeVisible();
    await page.setViewportSize({ width: 320, height: 851 });
    for (const button of [save, download]) {
      const box = await button.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(48);
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    }
    if (route === '/my-outlaw') {
      const passport = page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT', exact: true });
      await expect(passport).toBeEnabled();
      await expect(page.locator('.passport-art > .download-actions').getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT' })).toBeVisible();
      const next = page.waitForEvent('download'); await passport.click(); expect((await next).suggestedFilename()).toBe('robinhoot-passport-preview.png');
    }
    await page.reload(); await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Saved Android Fox');
  });
}

test('Save Draft never claims success when browser storage rejects writes', async ({ page }) => {
  await page.goto('/my-outlaw');
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toBeEnabled();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }).fill('Unsaved Fox');
  await page.getByRole('button', { name: 'SAVE DRAFT', exact: true }).click();
  await expect(page.getByText('Could not save locally:', { exact: false })).toBeVisible();
  await expect(page.getByText('Saved locally in this browser tab only.', { exact: false })).toHaveCount(0);
});
