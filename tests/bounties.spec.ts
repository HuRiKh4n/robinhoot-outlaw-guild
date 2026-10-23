import { test, expect } from '@playwright/test';
import { bounties, categories } from '../lib/bounties/catalogue';
import { choose, selected } from './creator-helpers';
import { mockMeteorWeb, openMeteor } from './helpers';

test('Bounty Board navigation, category filters and responsive contracts are usable without a wallet', async ({page}, testInfo) => {
  await page.goto('/');
  await page.locator('nav[aria-label="Main navigation"] a[href="/bounties"]:visible').click();
  await expect(page).toHaveURL(/\/bounties$/);
  await expect(page.getByRole('heading',{name:'THE BOUNTY BOARD.',exact:true})).toBeVisible();
  await expect(page.locator('.bounty-contract')).toHaveCount(6);
  await expect(page.locator('.bounty-contract .contract-status')).toHaveText(Array(6).fill('PREVIEW / COMING SOON'));
  for (const category of categories) {
    const button=page.getByRole('button',{name:`${category} Bounties`,exact:true});
    await button.focus(); await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.bounty-contract')).toHaveCount(2);
    await expect(page.locator('.bounty-count')).toHaveText(`2 ${category.toLowerCase()} mission previews`);
    for (const mission of bounties.filter(item=>item.category===category)) await expect(page.getByRole('heading',{name:mission.title,exact:true})).toBeVisible();
  }
  await page.getByRole('button',{name:'All contracts',exact:true}).click();
  for (const width of [320,393,768,1280]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const brand = await page.locator('.site-header .brand').boundingBox();
    const wallet = await page.locator('.site-header .wallet-trigger').boundingBox();
    expect(Math.abs((brand!.y + brand!.height/2) - (wallet!.y + wallet!.height/2))).toBeLessThan(2);
    for (const control of [page.getByRole('button',{name:'Creative Bounties',exact:true}),page.getByRole('link',{name:`Read mission: ${bounties[0].title}`,exact:true})]) {
      const box=await control.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(width);
    }
  }
  await page.setViewportSize({width:393,height:851});
  await page.screenshot({path:testInfo.outputPath('bounty-board-mobile.png'),fullPage:true});
  await expect(page.locator('#guild-reputation')).toContainText('CONCEPT PREVIEW · NOT LIVE');
  await expect(page.locator('.bounty-rewards')).toContainText('No rewards are currently available.');
  await expect(page.locator('.bounty-rewards')).toContainText('no guaranteed token distribution');
  await expect(page.locator('input[type="file"], form')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/submit|complete|claim|earn/i})).toHaveCount(0);
});

test('every contract has real detail navigation, draft requirements, future evidence and closed submissions', async ({page}, testInfo) => {
  for (const mission of bounties) {
    await page.goto('/bounties');
    await page.getByRole('link',{name:`Read mission: ${mission.title}`,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`/bounties/${mission.slug}$`));
    await expect(page.getByRole('heading',{name:mission.title,exact:true})).toBeVisible();
    await expect(page.locator('.bounty-detail .contract-status')).toHaveText('PREVIEW / COMING SOON');
    await expect(page.locator('.bounty-detail .contract-meta')).toContainText(mission.category);
    await expect(page.locator('.bounty-detail .contract-meta')).toContainText(mission.difficulty);
    for (const requirement of [...mission.requirements,...mission.futureEvidence]) await expect(page.getByText(requirement,{exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'This contract is not accepting submissions.',exact:true})).toBeVisible();
    await expect(page.locator('.contract-closed')).toContainText('no completion action, points balance or reward to claim');
    await expect(page.locator('input[type="file"], form')).toHaveCount(0);
    await expect(page.getByRole('button',{name:/submit|complete|claim|earn/i})).toHaveCount(0);
    await page.setViewportSize({width:320,height:851});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.getByRole('link',{name:'← BACK TO THE BOUNTY BOARD',exact:true}).click();
    await expect(page).toHaveURL(/\/bounties$/);
  }
  await page.goto(`/bounties/${bounties[0].slug}`);
  await page.screenshot({path:testInfo.outputPath('bounty-contract-mobile.png'),fullPage:true});
  const missing=await page.goto('/bounties/not-a-real-contract'); expect(missing?.status()).toBe(404);
});

test('board browsing preserves wallet and full local character; roadmap reports actual feature status', async ({page,context}) => {
  await mockMeteorWeb(context,['board.near']);
  await page.goto('/my-outlaw'); await openMeteor(page);
  await page.getByRole('button',{name:'Meteor Web',exact:true}).click();
  const wallet=page.getByRole('button',{name:'Wallet connected: board.near. Manage wallet',exact:true}); await expect(wallet).toBeEnabled();
  await page.getByRole('textbox',{name:'YOUR OUTLAW NAME'}).fill('Contract Keeper');
  await choose(page,'SPECIES','Wolf'); await choose(page,'CLASS','Mage'); await choose(page,'OUTFIT','Dark Sorcerer'); await choose(page,'PERSONALITY','Loyal');
  const before=await page.evaluate(()=>localStorage.getItem('robinhoot:profile:v1:mainnet:board.near'));
  await page.locator('nav[aria-label="Main navigation"] a[href="/bounties"]:visible').click();
  await page.getByRole('link',{name:`Read mission: ${bounties[0].title}`,exact:true}).click();
  await expect(wallet).toBeEnabled();
  await page.getByRole('link',{name:'← BACK TO THE BOUNTY BOARD',exact:true}).click();
  await page.getByRole('link',{name:'OPEN MY OUTLAW →',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'YOUR OUTLAW NAME'})).toHaveValue('Contract Keeper');
  await selected(page,'OUTFIT','Dark Sorcerer'); await selected(page,'PERSONALITY','Loyal');
  await expect(page.locator('.character-preview-large img')).toHaveAttribute('src','/characters/wolf/mage/dark-sorcerer.png');
  expect(await page.evaluate(()=>localStorage.getItem('robinhoot:profile:v1:mainnet:board.near'))).toBe(before);
  await page.goto('/#roadmap');
  await expect(page.locator('#roadmap')).toContainText('BOARD PREVIEW AVAILABLE');
  await expect(page.locator('#roadmap')).toContainText('Submissions, verification, reputation and badges are not live.');
  await expect(page.locator('#roadmap')).toContainText('No live AI generation.');
  await expect(page.locator('#roadmap')).toContainText('Nothing to claim');
});
