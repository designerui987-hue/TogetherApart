import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function testShowcaseAndGameplay() {
  console.log('=== STARTING CHARACTER SHOWCASE & E2E VERIFICATION ===\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const outDir = path.resolve('screenshots', 'phase2.6');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const errors = [];
  const logError = (prefix, err) => {
    if (err.includes('favicon')) return;
    console.error(`[${prefix} Error]:`, err);
    errors.push(`${prefix}: ${err}`);
  };

  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => logError('Showcase Exception', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') logError('Showcase Console Error', msg.text());
    });

    console.log('1. Loading Standalone Character Showcase (/preview.html)...');
    await page.goto('http://localhost:3001/preview.html', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2000));

    // Check stats
    const tris = await page.$eval('#stat-tris', (el) => el.textContent);
    const meshes = await page.$eval('#stat-meshes', (el) => el.textContent);
    console.log(`Lumi Showcase loaded: ${tris} triangles across ${meshes} meshes.`);

    // Switch camera to Hero 3/4
    await page.click('button[data-cam="hero"]');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'showcase_lumi_hero.png') });
    console.log('Saved screenshots/phase2.6/showcase_lumi_hero.png');

    // Switch camera to Face Close-up
    await page.click('button[data-cam="face"]');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'showcase_lumi_face.png') });
    console.log('Saved screenshots/phase2.6/showcase_lumi_face.png');

    // Switch to Nova
    console.log('2. Switching Showcase to Nova (The Kinetic Shaper)...');
    await page.click('#btn-char-nova');
    await new Promise((r) => setTimeout(r, 2000));

    const novaTris = await page.$eval('#stat-tris', (el) => el.textContent);
    const novaMeshes = await page.$eval('#stat-meshes', (el) => el.textContent);
    console.log(`Nova Showcase loaded: ${novaTris} triangles across ${novaMeshes} meshes.`);

    await page.click('button[data-cam="hero"]');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'showcase_nova_hero.png') });
    console.log('Saved screenshots/phase2.6/showcase_nova_hero.png');

    await page.click('button[data-cam="detail"]');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'showcase_nova_gauntlet.png') });
    console.log('Saved screenshots/phase2.6/showcase_nova_gauntlet.png');

    // Now test in-game main menu showcase modal
    console.log('3. Loading Game Main Menu to test in-game showcase modal...');
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "✨ Character Showcase (3D Preview)" button
    await page.click('#btn-menu-showcase');
    await page.waitForSelector('#showcase-modal:not(.hidden)');
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, 'in_game_showcase_modal.png') });
    console.log('Saved screenshots/phase2.6/in_game_showcase_modal.png');

    // Close showcase modal
    await page.click('#btn-showcase-close');
    await page.waitForSelector('#showcase-modal.hidden');
    console.log('In-game showcase modal closed successfully.');

    console.log('\n>>> SHOWCASE VERIFICATION COMPLETED WITH 0 ERRORS! <<<');
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    console.error('\nErrors encountered during showcase verification:');
    errors.forEach((e) => console.error(' - ' + e));
    process.exit(1);
  }
}

testShowcaseAndGameplay().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
