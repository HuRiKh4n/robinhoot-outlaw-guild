import { test, expect } from '@playwright/test';
import { access } from 'node:fs/promises';
import { resolveAppearance, portraits, type PortraitAsset } from '../lib/character/appearance';
import { classDraft, defaultDraft, outfitsFor, parseDraft } from '../lib/profile/draft';
import { choose, selected } from './creator-helpers';

const variants = portraits.filter(asset => !asset.fallback);
test('all twelve exact approved paths are registered; active variants resolve without cross-class substitution', async () => {
  expect(variants.map(asset=>asset.src)).toEqual([
    '/characters/wolf/ranger/patched-cloak.png', '/characters/wolf/ranger/leather-vest.png',
    '/characters/wolf/ranger/forest-hood.png', '/characters/wolf/mage/arcane-robes.png',
    '/characters/wolf/mage/dark-sorcerer.png', '/characters/wolf/mage/mystic-hood.png',
    '/characters/wolf/rogue/shadow-hood.png', '/characters/wolf/rogue/assassin-gear.png', '/characters/wolf/rogue/thief-cloak.png',
    '/characters/wolf/warrior/battle-armor.png',
    '/characters/wolf/warrior/berserker.png',
    '/characters/wolf/warrior/royal-guard.png',
  ]);
  const ready: PortraitAsset[] = variants;
  expect(ready.every(asset=>asset.status==='ready')).toBe(true);
  for (const asset of ready) {
    const draft={...defaultDraft,species:'Wolf' as const,class:asset.class as 'Ranger'|'Mage'|'Rogue'|'Warrior',outfit:asset.outfit!};
    expect(resolveAppearance(draft,ready).src).toBe(asset.src);
  }
  expect(resolveAppearance({...defaultDraft,species:'Wolf',class:'Scout'},ready).kind).toBe('unavailable');
  for (const asset of variants) {
    const exists=await access(`public${asset.src}`).then(()=>true,()=>false);
    expect(exists).toBe(true); // All approved originals must exist at these exact case-sensitive paths.
  }
});

test('draft migration preserves old aliases without rewriting storage and class changes choose valid outfits', async ({page}) => {
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Ranger',outfit:'Ragged Hood'})).outfit).toBe('Forest Hood');
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Ranger',outfit:'Worn Leather Vest'})).outfit).toBe('Leather Vest');
  expect(classDraft(defaultDraft,'Mage').outfit).toBe('Arcane Robes');
  expect(classDraft(defaultDraft,'Rogue').outfit).toBe('Shadow Hood');
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Rogue',outfit:'Ragged Hood'})).outfit).toBe('Shadow Hood');
  expect(classDraft(defaultDraft,'Warrior').outfit).toBe('Battle Armor');
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Warrior',outfit:'Ragged Hood'})).outfit).toBe('Battle Armor');
  expect(parseDraft(JSON.stringify({...defaultDraft,class:'Warrior',outfit:'Royal Guard'})).outfit).toBe('Royal Guard');
  await page.addInitScript(()=>sessionStorage.setItem('robinhoot:outlaw-draft',JSON.stringify({name:'Legacy Wolf',animal:'Wolf',class:'Ranger',outfit:'Ragged Hood',trait:'Loyal'})));
  await page.goto('/my-outlaw'); await selected(page,'OUTFIT','Forest Hood');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!).outfit)).toBe('Ragged Hood');
  await choose(page,'CLASS','Mage'); await selected(page,'OUTFIT','Arcane Robes');
  await expect(page.getByRole('radio')).toHaveCount(3);
  await choose(page,'CLASS','Ranger'); await selected(page,'OUTFIT',outfitsFor('Ranger')[0]);
  await expect(page.getByRole('radio')).toHaveCount(3);
  await choose(page,'CLASS','Rogue'); await selected(page,'OUTFIT','Shadow Hood');
  await expect(page.getByRole('radio')).toHaveCount(3);
  await choose(page,'OUTFIT','Thief Cloak');
  await choose(page,'CLASS','Warrior'); await selected(page,'OUTFIT','Battle Armor');
  await expect(page.getByRole('radio')).toHaveCount(3);
  await choose(page,'OUTFIT','Royal Guard');
  await choose(page,'CLASS','Mage'); await selected(page,'OUTFIT','Arcane Robes');
  await expect(page.getByRole('textbox',{name:'YOUR OUTLAW NAME'})).toHaveValue('Legacy Wolf');
  await expect(page.getByRole('tab',{name:/^Spirit/})).toContainText('Loyal');
});
