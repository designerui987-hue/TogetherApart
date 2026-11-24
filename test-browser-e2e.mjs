import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function testDualBrowserGameplay() {
  console.log('=== STARTING DUAL BROWSER END-TO-END VISUAL VERIFICATION ===\n');

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
    if (err.includes('favicon')) return;
    console.error(`[${prefix} Error]:`, err);
    errors.push(`${prefix}: ${err}`);
  };

  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  try {
    // --- BROWSER SESSION 1 (Player 1: Lumi) ---
    console.log('1. Launching Session 1 for Player 1 (Lumi)...');
    const page1 = await browser.newPage();
    page1.on('pageerror', (err) => logError('Page 1 Exception', err.message));
    page1.on('console', (msg) => {
      if (msg.type() === 'error') logError('Page 1 Console Error', msg.text());
    });

    await page1.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Verify Main Menu title & capture screenshot
    const menuTitle = await page1.$eval('.game-logo', (el) => el.textContent);
    console.log(`Page 1 Loaded: Menu Title = "${menuTitle.trim()}"`);
    await page1.screenshot({ path: path.join(screenshotsDir, 'main_menu_upgraded.png') });
    console.log('Saved screenshots/main_menu_upgraded.png');

    // Test Settings Modal & Quality Preset change
    console.log('2. Testing Settings modal & Graphics Quality presets...');
    await page1.$eval('#btn-menu-settings', (el) => el.click());
    await page1.waitForSelector('#settings-modal:not(.hidden)');
    // Switch to Ultra preset
    await page1.select('#select-graphics', 'ultra');
    // Enable performance overlay
    await page1.$eval('#check-show-perf', (el) => {
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });
    await page1.$eval('#btn-settings-close', (el) => el.click());
    await page1.waitForSelector('#settings-modal.hidden');
    console.log('Settings configured: Ultra preset + Performance overlay enabled.');

    // Test "How to Play" modal
    console.log('3. Testing "How to Play" modal on Page 1...');
    await page1.$eval('#btn-menu-how-to-play', (el) => el.click());
    await page1.waitForSelector('#how-to-play-modal:not(.hidden)');
    await page1.$eval('#btn-htp-close', (el) => el.click());
    await page1.waitForSelector('#how-to-play-modal.hidden');
    console.log('How to Play modal tested and closed.');

    // Create Room
    console.log('4. Player 1 Creating Room as Lumi...');
    await page1.$eval('#btn-menu-create', (el) => el.click());
    await page1.waitForSelector('#create-modal:not(.hidden)');
    await page1.$eval('#btn-create-confirm', (el) => el.click());

    // Wait for Lobby
    await page1.waitForSelector('#lobby-screen:not(.hidden)', { timeout: 8000 });
    const roomCode = await page1.$eval('#lobby-room-code', (el) => el.textContent.trim());
    console.log(`Room successfully created! Room Code: ${roomCode}`);

    // --- BROWSER SESSION 2 (Player 2: Nova) ---
    console.log('\n5. Launching Session 2 for Player 2 (Nova)...');
    const page2 = await browser.newPage();
    page2.on('pageerror', (err) => logError('Page 2 Exception', err.message));
    page2.on('console', (msg) => {
      if (msg.type() === 'error') logError('Page 2 Console Error', msg.text());
    });

    await page2.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Join Room with code from Page 1
    console.log(`6. Player 2 Joining Room ${roomCode}...`);
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

    // Capture Lobby screenshot
    await page1.screenshot({ path: path.join(screenshotsDir, 'lobby_upgraded.png') });
    console.log('Saved screenshots/lobby_upgraded.png');

    // 7. Both players click Ready
    console.log('7. Both players toggling Ready state...');
    await page1.$eval('#btn-lobby-ready', (el) => el.click());
    await page2.$eval('#btn-lobby-ready', (el) => el.click());

    // Wait for Start Button to be enabled on Page 1
    await page1.waitForFunction(() => {
      const btn = document.getElementById('btn-lobby-start');
      return btn && !btn.disabled;
    }, { timeout: 6000 });
    console.log('Lobby Start Adventure button is enabled!');

    // 8. Page 1 starts game
    console.log('8. Player 1 clicking Start Adventure...');
    await page1.$eval('#btn-lobby-start', (el) => el.click());

    // 9. Wait for both screens to transition to IN_GAME
    await Promise.all([
      page1.waitForSelector('#in-game-hud:not(.hidden)', { timeout: 8000 }),
      page2.waitForSelector('#in-game-hud:not(.hidden)', { timeout: 8000 }),
    ]);
    console.log('Both Browser Sessions successfully entered the 3D Game HUD!');

    // Wait 3.5 seconds for 3D simulation frames, physics, and shader rendering
    await new Promise((r) => setTimeout(r, 3500));

    // Read Performance Metrics from overlay on Page 1
    const fps = await page1.$eval('#perf-fps', (el) => el.textContent);
    const ms = await page1.$eval('#perf-ms', (el) => el.textContent);
    const calls = await page1.$eval('#perf-calls', (el) => el.textContent);
    const tris = await page1.$eval('#perf-tris', (el) => el.textContent);
    console.log(`Measured Performance Stats (Ultra Preset): ${fps} FPS | ${ms} | ${calls} draw calls | ${tris} triangles`);

    // Verify WebGL canvas exists on both pages
    const canvas1Exists = await page1.$eval('#game-container canvas', (el) => !!el);
    const canvas2Exists = await page2.$eval('#game-container canvas', (el) => !!el);
    console.log(`WebGL Canvas Check: Page 1 = ${canvas1Exists}, Page 2 = ${canvas2Exists}`);

    // Capture in-game screenshots for both players
    await page1.screenshot({ path: path.join(screenshotsDir, 'player1_upgraded.png') });
    await page2.screenshot({ path: path.join(screenshotsDir, 'player2_upgraded.png') });
    console.log('Saved screenshots to screenshots/player1_upgraded.png and player2_upgraded.png');

    if (errors.length > 0) {
      console.error(`\nFound ${errors.length} browser errors:`, errors);
      throw new Error(`Encountered browser errors: ${errors.join(', ')}`);
    }

    console.log('\n>>> DUAL BROWSER E2E VISUAL VERIFICATION PASSED WITH ZERO CONSOLE ERRORS! <<<');
  } finally {
    await browser.close();
  }
}

testDualBrowserGameplay().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
