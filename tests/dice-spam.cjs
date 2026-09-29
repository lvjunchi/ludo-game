const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const baseline = process.argv.includes('--baseline');
const types = {'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png'};
const server = http.createServer((req,res) => {
  const name = new URL(req.url,'http://localhost').pathname === '/' ? 'index.html' : new URL(req.url,'http://localhost').pathname.slice(1);
  const file = path.resolve(root,name);
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {res.writeHead(404);res.end();return;}
  const content = baseline && (name==='index.html' || name.startsWith('js/'))
    ? execFileSync('git',['show','7a0fb93:'+name],{cwd:root}) : fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(content);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Users/LvXiao/AppData/Local/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.click('[data-action="startGame"]');
    const result=await page.evaluate(async baseline=>{
      DICE_SPIN_FRAMES=2;DICE_SPIN_INTERVAL=10;DICE_MOVE_DELAY=100;STEP_DELAY=15;
      // 六步移动与下一次投掷的延迟交叉，模拟持续快速点击。
      Math.random=()=>0.99;
      let duplicates=0, clicks=0;
      const observer=new MutationObserver(()=>{
        if ([1,2].some(pid=>document.querySelectorAll('#gameBoard .piece.p'+pid).length>1)) duplicates++;
      });
      observer.observe(document.getElementById('gameBoard'),{childList:true,subtree:true});
      const spam=setInterval(()=>{
        clicks++;
        document.querySelector('.dice-area').click();
        if (!baseline) document.querySelector('.task-actions button')?.click();
      },3);
      await new Promise(resolve=>setTimeout(resolve,1800));clearInterval(spam);
      await new Promise(resolve=>setTimeout(resolve,700));observer.disconnect();
      return {clicks,duplicates,counts:[1,2].map(pid=>document.querySelectorAll('#gameBoard .piece.p'+pid).length)};
    },baseline);
    console.log(JSON.stringify({baseline,...result,errors}));
    assert.deepEqual(errors,[]);
    if (baseline) assert(result.duplicates>0,'old release should reproduce duplicate pieces');
    else {
      assert.equal(result.duplicates,0);assert(result.counts.every(n=>n<=1));
      await page.evaluate(async()=>{
        // 移动回调被重复调用时，也不能多走一次或创建第二个棋子。
        resetGame();
        gameState.diceValue=3;gameState.isTurnBusy=true;
        movePiece(1,gameState,getCurrentGenRef(),nextTurn,updateStats,resetGame);
        for(let i=0;i<20;i++) movePiece(1,gameState,getCurrentGenRef(),nextTurn,updateStats,resetGame);
        if(gameState.players[1].netMove!==3) throw new Error('duplicate move consumed dice twice');
        await new Promise(resolve=>setTimeout(resolve,400));
        if(document.querySelectorAll('#gameBoard .piece.p1').length!==1) throw new Error('duplicate callback left duplicate pieces');
        // 模拟旧版本或异常回调残留的多个棋子，重绘必须收敛为一个。
        const original=document.querySelector('#gameBoard .piece.p1');
        original.parentNode.appendChild(original.cloneNode(true));
        const stale=original.cloneNode(true);stale.classList.add('moving');document.getElementById('gameBoard').appendChild(stale);
        placePieces(gameState);
        if(document.querySelectorAll('#gameBoard .piece.p1').length!==1) throw new Error('stale pieces not cleaned');
        // 投掷中多次重开后，旧计时器不能移动新一局的棋子。
        for(let i=0;i<15;i++) { resetGame();rollDice();await new Promise(resolve=>setTimeout(resolve,5)); }
        resetGame();rollDice();
        await new Promise(resolve=>setTimeout(resolve,600));
        if(gameState.players[1].netMove!==6 || gameState.players[2].netMove!==0) throw new Error('old callbacks changed new round');
        if(document.querySelectorAll('#gameBoard .piece.p1').length!==1 || document.querySelectorAll('#gameBoard .piece.p2').length!==0) throw new Error('restart spam created duplicate pieces');
      });
      console.log('PASS duplicate move rejection, stale piece cleanup, rapid restart during dice roll');
    }
    await context.close();
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
