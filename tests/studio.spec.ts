import { expect, test } from '@playwright/test';
import { choose } from './creator-helpers';

test('choice deck supports keyboard tabs and honest artwork cards', async ({ page }) => {
  await page.goto('/my-outlaw');
  const first = page.getByRole('tab', { name: /^Species/ });
  await first.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /^Class/ })).toBeFocused();
  await page.keyboard.press('End'); await expect(page.getByRole('tab', { name: /^Spirit/ })).toBeFocused();
  await page.keyboard.press('Home'); await expect(first).toBeFocused();
  const wolf = page.getByRole('radio', { name: 'Wolf', exact: true });
  await wolf.focus(); await page.keyboard.press('Space'); await expect(wolf).toBeChecked();
  await choose(page, 'CLASS', 'Ranger');
  await expect(page.locator('.character-preview-large img')).toHaveAttribute('src', '/characters/wolf/ranger/portrait.png');
  await choose(page, 'OUTFIT', 'Forest Hood');
  await expect(page.locator('.art-availability')).toContainText('No cinematic artwork is available');
  await expect(page.locator('.choice-card.is-selected')).toContainText('Artwork unavailable');
  await expect(page.locator('.choice-card.is-selected img')).toHaveCount(0);
  await choose(page, 'CLASS', 'Mage');
  await expect(page.locator('.choice-card.is-selected')).toContainText('Artwork unavailable');
});

test('mobile portrait leads compact controls and parchment poster remains downloadable', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw'); await choose(page, 'SPECIES', 'Wolf'); await choose(page, 'CLASS', 'Ranger');
  for (const width of [320,393,768,1280]) {
    await page.setViewportSize({ width, height:851 });
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width <= 850) {
      const art=await page.locator('.portrait-pane').boundingBox(), controls=await page.locator('.controls').boundingBox();
      expect(art!.y+art!.height).toBeLessThanOrEqual(controls!.y+1);
    }
    for (const card of await page.locator('.choice-card').all()) {
      const box=await card.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(48);
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(width);
    }
  }
  await page.setViewportSize({width:393,height:851});
  await page.locator('.builder-stage').screenshot({path:testInfo.outputPath('premium-mobile-studio.png')});
  await page.locator('.poster').screenshot({path:testInfo.outputPath('parchment-wanted-poster.png')});
  await expect(page.getByRole('button',{name:'DOWNLOAD CHARACTER',exact:true})).toBeEnabled();
  await expect(page.getByRole('button',{name:'DOWNLOAD GUILD PASSPORT',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'SAVE DRAFT',exact:true}).click();
  await page.reload(); await expect(page.locator('.character-preview-large img')).toHaveAttribute('src','/characters/wolf/ranger/portrait.png');
});
