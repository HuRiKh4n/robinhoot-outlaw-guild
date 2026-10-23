import { choose, selected } from './creator-helpers';
import { expect, test } from '@playwright/test';
import { resolveAppearance, type PortraitAsset } from '../lib/character/appearance';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { defaultDraft } from '../lib/profile/draft';

test('cinematic catalogue only covers exact ready species/class/outfit combinations', () => {
  const wolf = { ...defaultDraft, species: 'Wolf' as const, class: 'Ranger' as const };
  // Resolver-only metadata fixture: no replacement artwork is shipped or shown in the app.
  const entry: PortraitAsset = { id: 'test-only', species: 'Wolf', class: 'Ranger', outfit: 'Patched Cloak', status: 'ready', src: '/characters/test-only.png', width: 1440, height: 1860, credit: 'Test metadata only' };
  const art = resolveAppearance(wolf, [entry]);
  expect(art.kind).toBe('cinematic'); expect(art.src).toBe(entry.src);
  expect(resolveAppearance({ ...wolf, name: 'Different name', personality: 'Loyal' }, [entry]).src).toBe(entry.src);
  expect(art.note).toContain('does not change this portrait');
  for (const selection of [{ ...wolf, outfit: 'Ragged Hood' as const }, { ...wolf, class: 'Mage' as const }, { ...wolf, species: 'Fox' as const }]) {
    expect(resolveAppearance(selection, [entry]).kind).toBe('unavailable');
  }
  expect(resolveAppearance(wolf, [{ ...entry, status: 'awaiting-artwork' }]).kind).toBe('unavailable');
  expect(resolveAppearance(wolf).src).toBe('/characters/wolf/ranger/patched-cloak.png');
  expect(resolveAppearance({ ...wolf, outfit: 'Ragged Hood' }).note).toContain('no other character or outfit is substituted');
});

const variants = [
  ['Ranger', 'Patched Cloak', '/characters/wolf/ranger/patched-cloak.png', '799fe7d245d58e77c15eea6c79cdb0321bf0234da76334baa3b526fcfd74134e'],
  ['Ranger', 'Leather Vest', '/characters/wolf/ranger/leather-vest.png', '40a85cc3cfe290c3f0d81efef43bb796c9fafd14798c677ec7a0ac9fcdec6674'],
  ['Ranger', 'Forest Hood', '/characters/wolf/ranger/forest-hood.png', '6fc8e8c4b1c1e57a9e43475427ec7c487f5d76dca717ed62fb37fa9e491618fc'],
  ['Mage', 'Arcane Robes', '/characters/wolf/mage/arcane-robes.png', '44959834c1c7692650ee8bef504d3a2d460dffe8354db99a96dd465bdfc545c3'],
];

test('all four actual Wolf images switch without reload and synchronize live, Wanted and profile', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => Reflect.set(window, '__robinhootPreviewMarker', 'same-document'));
  await choose(page, 'SPECIES', 'Wolf');
  const sources = new Set<string>();
  for (const [job, outfit, source, checksum] of variants) {
    const response = await page.request.get(source); expect(response.ok()).toBe(true);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(checksum);
    await choose(page, 'CLASS', job); await choose(page, 'OUTFIT', outfit);
    for (const selector of ['.character-preview-large img', '.poster img', '.profile-emblem img']) {
      const image = page.locator(selector);
      await expect(image).toHaveAttribute('src', source);
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(1030);
      expect(await image.evaluate(element => ({ height: (element as HTMLImageElement).naturalHeight, fit: getComputedStyle(element).objectFit }))).toEqual({height:1536, fit:'contain'});
    }
    sources.add((await page.locator('.character-preview-large img').getAttribute('src'))!);
  }
  expect(sources.size).toBe(4);
  expect(await page.evaluate(() => Reflect.get(window, '__robinhootPreviewMarker'))).toBe('same-document');
  await choose(page, 'CLASS', 'Rogue');
  await expect(page.locator('.character-preview-large img')).toHaveCount(0);
  await expect(page.locator('.art-availability')).toContainText('No cinematic artwork');
});

test('all four Wolf variants render into passport and both real PNG downloads', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw'); await choose(page, 'SPECIES', 'Wolf');
  const signatures = new Set<string>();
  for (const [index, [job, outfit, source]] of variants.entries()) {
    await choose(page, 'CLASS', job); await choose(page, 'OUTFIT', outfit);
    await expect(page.locator('.character-preview-large img')).toHaveAttribute('src',source);
    for (const label of ['DOWNLOAD CHARACTER', 'DOWNLOAD GUILD PASSPORT']) {
      const button=page.getByRole('button',{name:label,exact:true}); await expect(button).toBeEnabled();
      const signature=await page.locator('.passport canvas').evaluate(canvas=>(canvas as HTMLCanvasElement).toDataURL());
      const event=page.waitForEvent('download'); await button.click(); const file=await event;
      const path=testInfo.outputPath(`variant-${index}-${label==='DOWNLOAD CHARACTER'?'wanted':'passport'}.png`);
      await file.saveAs(path); const bytes=await readFile(path);
      expect(bytes.readUInt32BE(16)).toBe(840); expect(bytes.readUInt32BE(20)).toBe(1120);
      if(label==='DOWNLOAD GUILD PASSPORT') {
        expect(`data:image/png;base64,${bytes.toString('base64')}`).toBe(signature);
        signatures.add(createHash('sha256').update(bytes).digest('hex'));
      }
      // Independently rasterize the selected original and compare its entire contained image region
      // against the actual downloaded card. This catches stale images and accidental fixed artwork.
      expect(await page.evaluate(async ({source,png})=>{
        const original=new Image(); original.src=source; await original.decode();
        const downloaded=new Image(); downloaded.src=`data:image/png;base64,${png}`; await downloaded.decode();
        const reference=document.createElement('canvas'); reference.width=840; reference.height=1120;
        const ctx=reference.getContext('2d')!; ctx.fillStyle='#17201b'; ctx.fillRect(65,173,710,345);
        const scale=Math.min(710/original.naturalWidth,345/original.naturalHeight);
        const w=original.naturalWidth*scale,h=original.naturalHeight*scale;
        ctx.drawImage(original,65+(710-w)/2,173+(345-h)/2,w,h);
        const expected=ctx.getImageData(65,173,710,345).data;
        ctx.drawImage(downloaded,0,0); const actual=ctx.getImageData(65,173,710,345).data;
        return actual.every((value,i)=>value===expected[i]);
      },{source,png:bytes.toString('base64')})).toBe(true);
    }
    await page.locator('.builder-stage').screenshot({path:testInfo.outputPath(`wolf-variant-${index}.png`),animations:'disabled'});
  }
  expect(signatures.size).toBe(4);
  await page.reload(); await selected(page,'CLASS','Mage'); await selected(page,'OUTFIT','Arcane Robes');
  await expect(page.locator('.character-preview-large img')).toHaveAttribute('src','/characters/wolf/mage/arcane-robes.png');
});

test('cinematic studio stays usable at narrow Android and desktop sizes', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toBeEnabled();
  for (const width of [320, 393, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const control of [page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }), page.getByRole('tab', { name: /^Outfit/ }), page.getByRole('button', { name: 'SAVE DRAFT', exact: true })]) {
      const box = await control.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(48);
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    const portrait = await page.locator('.portrait-pane').boundingBox();
    const controls = await page.locator('.controls').boundingBox();
    if (width <= 850) expect(controls!.y).toBeGreaterThanOrEqual(portrait!.y + portrait!.height - 1);
    else expect(controls!.x).toBeGreaterThan(portrait!.x);
  }
  await page.setViewportSize({ width: 393, height: 851 });
  await page.locator('.builder-stage').screenshot({ path: testInfo.outputPath('cinematic-mobile-foundation.png') });
});
