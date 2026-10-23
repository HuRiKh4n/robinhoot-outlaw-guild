import { test, expect } from '@playwright/test';
import { access } from 'node:fs/promises';
import { resolveAppearance, portraits, type PortraitAsset } from '../lib/character/appearance';
import { classDraft, defaultDraft, outfitsFor, parseDraft } from '../lib/profile/draft';
import { choose, selected } from './creator-helpers';

const variants = portraits.filter(asset => !asset.fallback);
test('all four exact approved paths are registered; ready fixture variants resolve without cross-class substitution', async () => {
  expect(variants.map(asset=>asset.src)).toEqual([
    '/characters/wolf/ranger/patched-cloak.png', '/characters/wolf/ranger/leather-vest.png',
    '/characters/wolf/ranger/forest-hood.png', '/characters/wolf/mage/arcane-robes.png',
  ]);
  const ready: PortraitAsset[] = variants.map(asset=>({...asset,status:'ready',width:1030,height:1536}));
  for (const asset of ready) {
    const draft={...defaultDraft,species:'Wolf' as const,class:asset.class as 'Ranger'|'Mage',outfit:asset.outfit!};
    expect(resolveAppearance(draft,ready).src).toBe(asset.src);
  }
  expect(resolveAppearance({...defaultDraft,species:'Wolf',class:'Rogue'},ready).kind).toBe('unavailable');
  for (const asset of variants) {
    const exists=await access(`public${asset.src}`).then(()=>true,()=>false);
    expect(exists).toBe(asset.status==='ready'); // Exact case-sensitive disk paths, no alias substitution.
  }
});

test('draft migration preserves old aliases without rewriting storage and class changes choose valid outfits', async ({page}) => {
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Ranger',outfit:'Ragged Hood'})).outfit).toBe('Forest Hood');
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Ranger',outfit:'Worn Leather Vest'})).outfit).toBe('Leather Vest');
  expect(classDraft(defaultDraft,'Mage').outfit).toBe('Arcane Robes');
  await page.addInitScript(()=>sessionStorage.setItem('robinhoot:outlaw-draft',JSON.stringify({name:'Legacy Wolf',animal:'Wolf',class:'Ranger',outfit:'Ragged Hood',trait:'Loyal'})));
  await page.goto('/my-outlaw'); await selected(page,'OUTFIT','Forest Hood');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!).outfit)).toBe('Ragged Hood');
  await choose(page,'CLASS','Mage'); await selected(page,'OUTFIT','Arcane Robes');
  await expect(page.getByRole('radio')).toHaveCount(1);
  await choose(page,'CLASS','Ranger'); await selected(page,'OUTFIT',outfitsFor('Ranger')[0]);
  await expect(page.getByRole('radio')).toHaveCount(3);
});
