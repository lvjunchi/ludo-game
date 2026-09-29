// Run with Playwright available via NODE_PATH; no app runtime dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'ludo-qa-'));
let version = 'v3';
let legacyWorker = false;
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/ludo-game\//, '/');
  if (name === '/') name = '/index.html';
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  let content = fs.readFileSync(file);
  if (name === '/sw.js') content = Buffer.from(content.toString().replace(/ludo-cache-v\d+/, 'ludo-cache-' + version));
  if (name === '/sw.js' && legacyWorker) content = Buffer.from("self.addEventListener('install',e=>e.waitUntil(caches.open('ludo-cache-v2').then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(content);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Users/LvXiao/AppData/Local/Google/Chrome/Application/chrome.exe', headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(origin + '/ludo-game/');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.click('[data-action="openSettings"]');
    await page.click('#settingsOverlay [data-action="openAnniversary"]');
    await page.click('#anniversaryInput');
    assert(await page.locator('#anniversaryOverlay').evaluate(el => el.classList.contains('show')));
    await page.fill('#anniversaryInput', '2020-01-01');
    await page.click('[data-action="saveAnniversary"]');
    await page.waitForFunction(() => loadAchievements().unlocked.includes('set_anniversary'));
    await page.click('[data-action="startGame"]');
    await page.evaluate(() => { DICE_SPIN_FRAMES = 2; DICE_SPIN_INTERVAL = 10; DICE_MOVE_DELAY = 220; STEP_DELAY = 5; Math.random = () => 0; });
    await page.click('[data-action="rollDice"]');
    await page.waitForFunction(() => gameState.diceValue === 1);
    await page.evaluate(() => rollDice());
    await page.waitForSelector('.task-overlay');
    assert.equal(await page.evaluate(() => gameState.players[1].netMove), 1);
    await page.waitForTimeout(1600);
    assert.equal(await page.evaluate(() => gameState.currentPlayer), 1);
    await page.locator('.task-actions button').filter({ hasText: '返回首页' }).click();
    assert.equal(await page.evaluate(() => gameState.currentPlayer), 1);
    await page.click('[data-action="startGame"]');
    await page.waitForSelector('.task-overlay');
    await page.locator('.task-actions button').filter({ hasText: '完成' }).click();
    assert.equal(await page.evaluate(() => gameState.currentPlayer), 2);
    await page.click('[data-action="rollDice"]');
    await page.evaluate(() => handleGoHome());
    assert.notEqual(await page.locator('.game-container').evaluate(el => el.style.display), 'none');
    await page.waitForSelector('.task-overlay');
    await page.locator('.task-actions button').filter({ hasText: '跳过' }).click();
    assert.equal(await page.evaluate(() => gameState.currentPlayer), 1);
    await page.evaluate(() => {
      gameState.players[1].pos = 53; gameState.players[1].netMove = 54; gameState.diceValue = 6; gameState.isTurnBusy = true;
      movePiece(1, gameState, getCurrentGenRef(), nextTurn, updateStats, resetGame);
    });
    await page.waitForFunction(() => gameState.gameOver);
    assert.equal(await page.evaluate(() => gameState.players[1].pos), 55);
    assert.equal(await page.evaluate(() => gameStats.total), 1);
    await page.evaluate(() => { resetGame(); handleGoHome(); });
    console.log('PASS turn lock, task completion/skip, home resume, terminal bounds');

    await page.evaluate(async () => {
      await achievementChecks;
      savePlayers({1:{name:'备份玩家',icon:'🐺'},2:{name:'测试伴侣',icon:'🐷'}});
      saveStats({total:9,p1Wins:5,p2Wins:4});
      const canvas = document.createElement('canvas'); canvas.width=2400; canvas.height=1200;
      canvas.getContext('2d').fillRect(0,0,2400,1200);
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      const compressed = await compressPhoto(new File([blob], 'photo.png', {type:'image/png'}), ALBUM_MAX_SIZE);
      const image = await createImageBitmap(await (await fetch(compressed)).blob());
      if (image.width !== 1600 || image.height !== 800) throw new Error('wrong album dimensions');
      const id = await addPhoto({data:compressed,caption:'清晰照片',date:'2026-09-29'});
      await addMemory({title:'回忆',content:'<script>不执行</script>',date:'2026-09-29',photoId:id});
      const avatar = await compressPhoto(new File([blob], 'avatar.png', {type:'image/png'}), PHOTO_MAX_SIZE);
      const avatarImage = await createImageBitmap(await (await fetch(avatar)).blob());
      if (avatarImage.width !== 320) throw new Error('wrong avatar dimensions');
    });
    const backup = await page.evaluate(async () => validateBackup(await collectBackup()));
    await page.evaluate(async () => {
      openMemoryPage(); await renderMemoryTimeline();
      openMemoryEditor((await getAllMemories())[0]);
    });
    await page.fill('#memoryTitle', '更新后的回忆');
    await page.click('[data-action="saveMemory"]');
    await page.waitForFunction(() => document.querySelector('.home-toast')?.textContent === '回忆已更新 📝');
    await page.evaluate(() => { closeMemoryPage(); openBackup(); });
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-action="exportBackup"]');
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.app, 'couple-ludo');
    assert.equal(exported.photos.length, 1);
    await page.locator('#backupFileInput').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"app":"wrong"}')});
    await page.waitForFunction(() => document.querySelector('#backupPreview').textContent.includes('无法读取'));
    assert(await page.locator('#restoreBackupBtn').isDisabled());
    assert.equal(await page.evaluate(() => loadStats().total), 9);
    console.log('PASS image sizing, memory update message, export, malformed import rejection');

    await page.evaluate(async () => {
      const before = await collectBackup();
      const incoming = JSON.parse(JSON.stringify(before)); incoming.settings.ludo_stats='{"total":100,"p1Wins":50,"p2Wins":50}'; incoming.photos=[]; incoming.memories=[];
      const original = Storage.prototype.setItem;
      let fail = true;
      Storage.prototype.setItem = function(key,value) {
        if (key === 'ludo_stats' && fail) { fail=false; throw new DOMException('test quota','QuotaExceededError'); }
        return original.call(this,key,value);
      };
      let rejected=false;
      try { await writeBackupRecords(incoming,incoming.settings); } catch(e) { rejected=true; }
      finally { Storage.prototype.setItem=original; }
      const after=await collectBackup();
      if (!rejected || JSON.stringify(after.settings)!==JSON.stringify(before.settings) || JSON.stringify(after.photos)!==JSON.stringify(before.photos) || JSON.stringify(after.memories)!==JSON.stringify(before.memories)) throw new Error('rollback failed');
    });
    console.log('PASS quota failure rollback of localStorage and both IndexedDB stores');

    // Restore through the UI in a separate browser context to verify migration.
    const fresh = await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
    const restored = await fresh.newPage();
    restored.on('pageerror',e => errors.push(e.message));
    restored.on('dialog',dialog => dialog.accept());
    await restored.goto(origin + '/ludo-game/');
    await restored.evaluate(() => openBackup());
    await restored.locator('#backupFileInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await restored.waitForFunction(() => !!pendingBackup);
    await restored.selectOption('#backupMode','replace');
    await restored.click('#restoreBackupBtn');
    await restored.waitForFunction(() => loadStats().total === 9 && !backupBusy);
    assert((await restored.locator('#homeNames').textContent()).includes('备份玩家'));
    assert.equal(await restored.evaluate(async () => (await getAllMemories())[0].content), '<script>不执行</script>');
    await restored.evaluate(() => openBackup());
    await restored.locator('#backupFileInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await restored.waitForFunction(() => !!pendingBackup);
    await restored.selectOption('#backupMode','merge');
    await restored.click('#restoreBackupBtn');
    await restored.waitForFunction(() => !backupBusy && !document.querySelector('#backupOverlay').classList.contains('show'));
    assert.equal(await restored.evaluate(async () => (await getAllPhotos()).length), 1);
    assert.equal(await restored.evaluate(async () => (await getAllMemories()).length), 1);
    assert.equal(await restored.evaluate(() => loadStats().total), 9);
    console.log('PASS cross-context restore and repeat merge deduplication');

    for (const width of [320,375,390,768]) {
      await restored.setViewportSize({width,height:844});
      await restored.evaluate(() => handleStartGame());
      await restored.waitForTimeout(1800);
      await restored.evaluate(() => scrollTo(0,0));
      assert(await restored.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow at '+width);
      await restored.screenshot({path:path.join(artifacts,`game-${width}.png`)});
      await restored.evaluate(() => { handleGoHome(); openBackup(); });
      assert(await restored.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await restored.screenshot({path:path.join(artifacts,`backup-${width}.png`)});
      await restored.evaluate(() => closeBackup());
    }
    console.log('PASS mobile/tablet layouts at 320,375,390,768px');
    await restored.waitForFunction(() => !!navigator.serviceWorker.controller);
    await fresh.setOffline(true);
    await restored.goto(origin + '/ludo-game/');
    assert((await restored.locator('#homeNames').textContent()).includes('备份玩家'));
    await restored.click('[data-action="startGame"]');
    assert.equal(await restored.locator('#gameBoard .cell').count(), 225);
    await restored.goto(origin + '/ludo-game/index.html');
    assert((await restored.locator('#homeNames').textContent()).includes('备份玩家'));
    await fresh.setOffline(false);
    version='v4';
    await restored.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
    await restored.waitForFunction(() => !document.querySelector('#appUpdateBanner').hidden);
    await Promise.all([restored.waitForEvent('load'),restored.click('[data-action="applyUpdate"]')]);
    await restored.waitForFunction(async () => (await caches.keys()).includes('ludo-cache-v4'));
    assert.equal(await restored.evaluate(() => loadStats().total),9);
    assert.equal(await restored.evaluate(async () => (await getAllPhotos()).length),1);
    console.log('PASS subpath offline root/index startup and update activation with preserved data');
    const legacy = await browser.newContext();
    const old = await legacy.newPage();
    legacyWorker=true;
    await old.goto(origin+'/');
    await old.waitForFunction(() => !!navigator.serviceWorker.controller);
    legacyWorker=false;
    const migrated=old.waitForEvent('load');
    await old.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
    await migrated;
    await old.waitForFunction(async()=> !(await caches.keys()).includes('ludo-cache-v2'));
    console.log('PASS legacy v2 migration without a stuck waiting worker');
    await legacy.close();
    assert.deepEqual(errors, []);
    console.log('PASS no browser runtime errors');
    console.log('Screenshots: '+artifacts);
    await fresh.close(); await context.close();
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode=1; });
