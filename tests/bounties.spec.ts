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
  await page.mouse.move(0,0);
  await page.screenshot({path:testInfo.outputPath('bounty-board-mobile.png'),fullPage:true,animations:'disabled'});
  await expect(page.locator('.badge-concept')).toHaveCount(3);
  for (const label of ['CRAFT','STORY','SERVICE']) await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible();
  await expect(page.locator('.badge-concept')).toHaveText(Array(3).fill('CONCEPT /NOT YET EARNABLE'));
  await expect(page.getByRole('complementary',{name:'Bounty Board preview'})).toHaveCount(1);
  await page.getByText('Availability & safety',{exact:true}).click();
  await expect(page.getByText('Missions cannot be completed here.',{exact:false})).toBeVisible();
  await page.getByText('Availability & safety',{exact:true}).click();
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
    await page.getByText('Evidence a future submission could include',{exact:true}).click();
    for (const requirement of [...mission.requirements,...mission.futureEvidence]) await expect(page.getByText(requirement,{exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Submissions closed',exact:true})).toBeVisible();
    await expect(page.locator('.contract-closed')).toContainText('A submission and verification backend is required');
    await expect(page.locator('input[type="file"], form')).toHaveCount(0);
    await expect(page.getByRole('button',{name:/submit|complete|claim|earn/i})).toHaveCount(0);
    await page.setViewportSize({width:320,height:851});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.getByRole('link',{name:'← BACK TO THE BOUNTY BOARD',exact:true}).click();
    await expect(page).toHaveURL(/\/bounties$/);
  }
  await page.goto(`/bounties/${bounties[0].slug}`);
  await page.screenshot({path:testInfo.outputPath('bounty-contract-mobile.png'),fullPage:true,animations:'disabled'});
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
  await expect(page.locator('#roadmap')).toContainText('The board is pinned to the tavern wall. Taking on jobs comes next.');
  await expect(page.locator('#roadmap')).toContainText('The chest is still locked.');
  await expect(page.locator('#roadmap li.is-done')).toHaveCount(2);
});


test('hall decoration stays lightweight and stable; reduced motion and essential disclosures remain accessible', async ({page}, testInfo) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(() => {
    Reflect.set(window,'__boardLayoutShift',0);
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const shift=entry as PerformanceEntry & {hadRecentInput:boolean;value:number};
        if (!shift.hadRecentInput) Reflect.set(window,'__boardLayoutShift',Reflect.get(window,'__boardLayoutShift')+shift.value);
      }
    }).observe({type:'layout-shift',buffered:true});
  });
  await page.goto('/bounties');
  await expect(page.locator('.bounty-contract')).toHaveCount(6);
  await expect(page.getByRole('button',{name:'CONNECT WALLET',exact:true})).toBeEnabled();
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  expect(await page.evaluate(()=>Reflect.get(window,'__boardLayoutShift'))).toBeLessThanOrEqual(.01);
  expect(await page.locator('.guild-hall-entry').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
  expect(await page.locator('.bounty-hero').evaluate(element=>getComputedStyle(element,'::after').animationName)).toBe('none');
  expect(await page.locator('.bounty-contract').first().evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  let bytes=0;
  for (const asset of ['guild-hall.svg','parchment-grain.svg']) {
    const response=await page.request.get(`/bounties/${asset}`);expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/svg+xml');bytes+=(await response.body()).length;
  }
  expect(bytes).toBeLessThan(20000);
  expect(await page.evaluate(()=>performance.getEntriesByType('resource').some(entry=>entry.name.includes('/characters/')))).toBe(false);
  const summary=page.getByText('Availability & safety',{exact:true});await summary.focus();await page.keyboard.press('Enter');
  await expect(page.getByText('Missions cannot be completed here.',{exact:false})).toBeVisible();
  const rewards=page.getByText('Future rewards & availability',{exact:true});await rewards.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.treasury-copy details p')).toBeVisible();
  for (const width of [320,360,393,768,1280]) {
    await page.setViewportSize({width,height:851});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const heading of await page.locator('.bounty-page h1,.bounty-page h2,.bounty-page h3').all()) {
      expect(await heading.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    }
  }
  await page.setViewportSize({width:393,height:851});
  await page.getByText('Future rewards & availability',{exact:true}).click();
  await page.getByText('Availability & safety',{exact:true}).click();
  await page.mouse.move(0,0);
  await page.locator('.bounty-hero').screenshot({path:testInfo.outputPath('guild-hall-reduced-motion.png')});
  await page.locator('#guild-reputation').screenshot({path:testInfo.outputPath('recognition-concepts.png')});
  await page.locator('.bounty-rewards').screenshot({path:testInfo.outputPath('sealed-treasury.png')});
});
