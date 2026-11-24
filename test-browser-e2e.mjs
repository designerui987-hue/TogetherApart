import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function testDualBrowserGameplay() {
  console.log('=== STARTING DUAL BROWSER END-TO-END VERIFICATION ===\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const errors = [];
  const logError = (prefix, err) => {
    // Ignore harmless favicon or font warnings if any
    if (err.includes('favicon')) return;
    console.error(`[${prefix} Error]:`, err);
    errors.push(`${prefix}: ${err}`);
  };

  try {
    // --- BROWSER SESSION 1 (Player 1: Lumi) ---
    console.log('1. Launching Session 1 for Player 1 (Lumi)...');
    const page1 = await browser.newPage();
    page1.on('pageerror', (err) => logError('Page 1 Exception', err.message));
    page1.on('console', (msg) => {
      if (msg.type() === 'error') logError('Page 1 Console Error', msg.text());
    });

    await page1.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

    // Verify Main Menu title
    const menuTitle = await page1.$eval('.game-logo', (el) => el.textContent);
    console.log(`Page 1 Loaded: Menu Title = "${menuTitle.trim()}"`);

    // Verify How to Play modal
    console.log('2. Testing "How to Play" modal on Page 1...');
    await page1.$eval('#btn-menu-how-to-play', (el) => el.click());
    await page1.waitForSelector('#how-to-play-modal:not(.hidden)');
    console.log('How to Play modal is visible.');
    await page1.$eval('#btn-htp-close', (el) => el.click());
    await page1.waitForSelector('#how-to-play-modal.hidden');
    console.log('How to Play modal closed.');

    // Create Room
    console.log('3. Player 1 Creating Room...');
    await page1.$eval('#btn-menu-create', (el) => el.click());
    await page1.waitForSelector('#create-modal:not(.hidden)');
    await page1.$eval('#btn-create-confirm', (el) => el.click());

    // Wait for Lobby
    await page1.waitForSelector('#lobby-screen:not(.hidden)', { timeout: 8000 });
    const roomCode = await page1.$eval('#lobby-room-code', (el) => el.textContent.trim());
    console.log(`Room successfully created! Room Code: ${roomCode}`);

    if (!roomCode || roomCode.length !== 6 || roomCode === '------') {
      throw new Error(`Invalid room code rendered: "${roomCode}"`);
    }

    // --- BROWSER SESSION 2 (Player 2: Nova) ---
    console.log('\n4. Launching Session 2 for Player 2 (Nova)...');
    const page2 = await browser.newPage();
    page2.on('pageerror', (err) => logError('Page 2 Exception', err.message));
    page2.on('console', (msg) => {
      if (msg.type() === 'error') logError('Page 2 Console Error', msg.text());
    });

    await page2.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

    // Join Room with code from Page 1
    console.log(`5. Player 2 Joining Room ${roomCode}...`);
    await page2.$eval('#btn-menu-join', (el) => el.click());
    await page2.waitForSelector('#join-modal:not(.hidden)');
    await page2.type('#join-code', roomCode);
    await page2.$eval('#btn-join-confirm', (el) => el.click());

    // Wait for Lobby on Page 2
    await page2.waitForSelector('#lobby-screen:not(.hidden)', { timeout: 8000 });
    console.log('Player 2 successfully entered the Lobby!');

    // Verify both player slots are populated on Page 1
    await page1.waitForFunction(() => {
      const p2Badge = document.querySelector('#slot-player-2 .slot-name');
      return p2Badge && p2Badge.textContent.includes('Nova');
    }, { timeout: 6000 });
    console.log('Page 1 Lobby confirmed Player 2 has joined!');

    // 6. Both players click Ready
    console.log('6. Both players toggling Ready state...');
    await page1.$eval('#btn-lobby-ready', (el) => el.click());
    await page2.$eval('#btn-lobby-ready', (el) => el.click());

    // Wait for Start Button to be enabled on Page 1
    await page1.waitForFunction(() => {
      const btn = document.getElementById('btn-lobby-start');
      return btn && !btn.disabled;
    }, { timeout: 6000 });
    console.log('Lobby Start Adventure button is enabled!');

    // 7. Page 1 starts game
    console.log('7. Player 1 clicking Start Adventure...');
    await page1.$eval('#btn-lobby-start', (el) => el.click());

    // 8. Wait for both screens to transition to IN_GAME
    await Promise.all([
      page1.waitForSelector('#in-game-hud:not(.hidden)', { timeout: 8000 }),
      page2.waitForSelector('#in-game-hud:not(.hidden)', { timeout: 8000 }),
    ]);
    console.log('Both Browser Sessions successfully entered the 3D Game HUD!');

    // Wait 3 seconds for 3D simulation frames & physics stepping
    await new Promise((r) => setTimeout(r, 3000));

    // Verify WebGL canvas exists on both pages
    const canvas1Exists = await page1.$eval('#game-container canvas', (el) => !!el);
    const canvas2Exists = await page2.$eval('#game-container canvas', (el) => !!el);
    console.log(`WebGL Canvas Check: Page 1 = ${canvas1Exists}, Page 2 = ${canvas2Exists}`);

    // Verify HUD elements on both pages
    const p1HudText = await page1.$eval('#hud-checkpoint-title', (el) => el.textContent);
    const p2HudText = await page2.$eval('#hud-checkpoint-title', (el) => el.textContent);
    console.log(`HUD Check: Page 1 checkpoint = "${p1HudText}", Page 2 checkpoint = "${p2HudText}"`);

    // Capture screenshots
    const screenshotsDir = path.resolve('screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
    await page1.screenshot({ path: path.join(screenshotsDir, 'player1_ingame.png') });
    await page2.screenshot({ path: path.join(screenshotsDir, 'player2_ingame.png') });
    console.log('Saved screenshots to screenshots/player1_ingame.png and player2_ingame.png');

    if (errors.length > 0) {
      console.error(`\nFound ${errors.length} browser errors:`, errors);
      throw new Error(`Encountered browser errors: ${errors.join(', ')}`);
    }

    console.log('\n>>> DUAL BROWSER E2E MULTIPLAYER TEST PASSED WITH ZERO CONSOLE ERRORS! <<<');
  } finally {
    await browser.close();
  }
}

testDualBrowserGameplay().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
