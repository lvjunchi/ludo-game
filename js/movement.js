// 情侣飞行棋 - 棋子移动与胜利庆祝

var celebrationCleanup = null;

// ============ 移动动画 ============

function animateMove(playerId, fromPos, toPos, gameState, currentGenRef, callback, forward) {
  if (forward === undefined) forward = true;
  var gen = currentGenRef.current;
  var player = gameState.players[playerId];
  gameState.isAnimating = true;
  buildCellPosCache();

  var steps = [];
  if (fromPos !== toPos) {
    var cur = fromPos;
    var safety = TOTAL_CELLS + 1;
    while (cur !== toPos && safety > 0) {
      cur = forward ? (cur + 1) % TOTAL_CELLS : (cur - 1 + TOTAL_CELLS) % TOTAL_CELLS;
      steps.push(cur);
      safety--;
    }
  }

  document.querySelectorAll(".piece.p" + playerId + ":not(.moving)").forEach(function(p) { p.remove(); });

  var movingPiece = document.createElement("div");
  movingPiece.className = "piece p" + playerId + " moving";
  movingPiece.textContent = player.icon;
  var board = document.querySelector(".game-board");
  board.appendChild(movingPiece);

  var startPos = fromPos === -1 ? toPos : fromPos;
  var s = getCellPos(startPos);
  movingPiece.style.left = s.x + "px";
  movingPiece.style.top = s.y + "px";

  var stepIndex = 0;
  function moveStep() {
    if (gen !== currentGenRef.current) { movingPiece.remove(); gameState.isAnimating = false; return; }
    if (stepIndex >= steps.length) {
      gameState.isAnimating = false;
      placePieces(gameState);
      movingPiece.remove();
      vibrate(20);
      if (callback) callback();
      return;
    }
    var pos = getCellPos(steps[stepIndex]);
    movingPiece.style.left = pos.x + "px";
    movingPiece.style.top = pos.y + "px";
    stepIndex++;
    setTimeout(moveStep, STEP_DELAY);
  }

  requestAnimationFrame(function() { setTimeout(moveStep, STEP_DELAY); });
}

// ============ 移动逻辑 ============

function movePiece(playerId, gameState, currentGenRef, onNextTurn, onUpdateStats, onResetGame) {
  if (gameState.gameOver) return;
  if (playerId !== gameState.currentPlayer) return;
  var gen = currentGenRef.current;
  var player = gameState.players[playerId];
  var dice = gameState.diceValue;

  if (player.pos === -1) {
    var newPos = (player.startCell + dice) % TOTAL_CELLS;
    player.netMove = dice;
    player.pos = newPos;
    showMessage(player.name + " 掷了 " + dice + "，出发！");
    animateMove(playerId, player.startCell, newPos, gameState, currentGenRef, function() {
      if (gen !== currentGenRef.current) return;
      afterMove(playerId, newPos, CELL_EVENTS[newPos] || null, gen, gameState, currentGenRef, onNextTurn);
    }, true);
    return;
  }

  var oldPos = player.pos;
  var newPos = (player.pos + dice) % TOTAL_CELLS;
  player.netMove += dice;
  showMessage(player.name + " 掷了 " + dice);

  if (player.netMove >= TOTAL_CELLS) {
    var finalPos = TOTAL_CELLS - 1;
    player.pos = finalPos;
    if (oldPos === finalPos) {
      gameState.gameOver = true;
      showWin(playerId, gen, gameState, onUpdateStats, onResetGame);
    } else {
      animateMove(playerId, oldPos, finalPos, gameState, currentGenRef, function() {
        gameState.gameOver = true;
        showWin(playerId, gen, gameState, onUpdateStats, onResetGame);
      }, true);
    }
    return;
  }

  player.pos = newPos;
  animateMove(playerId, oldPos, newPos, gameState, currentGenRef, function() {
    if (gen !== currentGenRef.current) return;
    afterMove(playerId, newPos, CELL_EVENTS[newPos] || null, gen, gameState, currentGenRef, onNextTurn);
  }, true);
}

function afterMove(playerId, pos, eventText, gen, gameState, currentGenRef, onNextTurn) {
  if (gen !== currentGenRef.current) return;
  if (eventText) {
    playSound("event");
    vibrate([30, 50, 30]);
    showPopup(eventText);
    var popupBox = document.querySelector(".popup-box");
    if (popupBox) {
      popupBox.style.borderColor = playerId === 1 ? "#e53935" : "#42a5f5";
    }
    setTimeout(function() {
      if (gen !== currentGenRef.current) return;
      placePieces(gameState);
      onNextTurn();
    }, POPUP_DURATION);
  } else {
    placePieces(gameState);
    onNextTurn();
  }
}

// ============ 胜利庆祝 ============

function showWin(playerId, gen, gameState, onUpdateStats, onResetGame) {
  var winnerName = gameState.players[playerId]?.name || "玩家";
  var loserId = playerId === 1 ? 2 : 1;
  var loserName = gameState.players[loserId]?.name || "对方";

  if (onUpdateStats) onUpdateStats(playerId);

  playSound("win");
  vibrate([100, 50, 100, 50, 200]);
  showMessage("恭喜！" + winnerName + " 走完一圈，获胜了！🎉");

  showConsolationMsg(loserName);
  showWinOverlay(winnerName, onResetGame);
  showCelebrationEmojis();
  showConsolationMsgEmojis();
  startCelebrationCanvas();
}

function showConsolationMsg(loserName) {
  var consMsg = document.createElement("div");
  consMsg.className = "consolation-msg";
  consMsg.textContent = "😢 " + loserName + " 别灰心，下次加油！💪";
  var board = document.querySelector(".game-board");
  if (board) board.after(consMsg);
  setTimeout(function() { consMsg.remove(); }, CONSOLATION_DURATION);
}

function showWinOverlay(name, onResetGame) {
  var overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  var box = document.createElement("div");
  box.className = "popup-box win-box";

  var msg = document.createElement("div");
  msg.style.marginBottom = "16px";
  msg.textContent = "恭喜！" + name + " 走完一圈，获胜了！🎉";

  var btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";

  var againBtn = document.createElement("button");
  againBtn.className = "editor-btn save play-again-btn";
  againBtn.textContent = "再来一局";
  againBtn.onclick = function() { if (onResetGame) onResetGame(); };

  var closeBtn = document.createElement("button");
  closeBtn.className = "editor-btn cancel";
  closeBtn.textContent = "关闭";
  closeBtn.onclick = function() { if (onResetGame) onResetGame(); };

  btnRow.appendChild(againBtn);
  btnRow.appendChild(closeBtn);
  box.appendChild(msg);
  box.appendChild(btnRow);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function spawnEmojiCelebration(container, emojis, count, minSize, maxSize) {
  for (var i = 0; i < count; i++) {
    var span = document.createElement("span");
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.left = Math.random() * 100 + "%";
    span.style.animationDelay = Math.random() * 2 + "s";
    span.style.animationDuration = (1.5 + Math.random() * 2) + "s";
    if (minSize && maxSize) {
      span.style.fontSize = (minSize + Math.random() * (maxSize - minSize)) + "px";
    }
    container.appendChild(span);
  }
}

function showCelebrationEmojis() {
  var cele = document.createElement("div");
  cele.className = "celebration";
  var winEmojis = ["🎉", "🎊", "❤️", "💕", "⭐", "🌹", "✨", "🏆", "🥇"];
  spawnEmojiCelebration(cele, winEmojis, 24);
  document.body.appendChild(cele);
  setTimeout(function() { cele.remove(); }, WIN_MSG_DURATION);
}

function showConsolationMsgEmojis() {
  var consCele = document.createElement("div");
  consCele.className = "consolation-cele";
  var consEmojis = ["🤗", "💪", "😊", "❤️", "🫂", "💗", "🌷", "☕"];
  spawnEmojiCelebration(consCele, consEmojis, 12, 18, 32);
  document.body.appendChild(consCele);
  setTimeout(function() { consCele.remove(); }, WIN_MSG_DURATION);
}

function startCelebrationCanvas() {
  var canvas = document.createElement("canvas");
  canvas.className = "celebration-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var colors = ["#ff6b6b","#feca57","#48dbfb","#ff9ff3","#54a0ff","#5f27cd","#01a3a4","#f368e0","#ff6348"];
  var confetti = [];
  var fireworks = [];
  var stars = [];
  var startTime = Date.now();
  var running = true;

  celebrationCleanup = function() { running = false; canvas.remove(); celebrationCleanup = null; };

  for (var ci = 0; ci < CONFETTI_COUNT; ci++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: 4 + Math.random() * 10,
      h: 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.8,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 6,
      drift: Math.random() * 0.5,
    });
  }

  for (var si = 0; si < STAR_COUNT; si++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1 + Math.random() * 2,
      a: Math.random(),
      da: 0.02 + Math.random() * 0.03,
    });
  }

  function spawnFirework() {
    var x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    var y = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
    var color = colors[Math.floor(Math.random() * colors.length)];
    for (var fi = 0; fi < FIREWORK_COUNT; fi++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 5;
      fireworks.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: color,
        size: 1.5 + Math.random() * 2.5,
        decay: 0.008 + Math.random() * 0.015,
      });
    }
  }

  var fireworkTick = 0;
  function animate() {
    if (!running) return;
    var elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > CELEBRATION_DURATION) {
      running = false;
      canvas.remove();
      celebrationCleanup = null;
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(function(s) {
      s.a += s.da;
      if (s.a > 1 || s.a < 0.1) s.da = -s.da;
      ctx.globalAlpha = s.a * 0.6;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    confetti.forEach(function(c) {
      c.y += c.vy;
      c.x += Math.sin(c.y * 0.02) * 0.3 + c.vx;
      c.rot += c.rotV;
      if (c.y > canvas.height + 20) { c.y = -20; c.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot * Math.PI / 180);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    fireworkTick++;
    if (fireworkTick % 12 === 0 && elapsed < 4.5) spawnFirework();

    for (var fi = fireworks.length - 1; fi >= 0; fi--) {
      var f = fireworks[fi];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.04;
      f.life -= f.decay;
      if (f.life <= 0) { fireworks.splice(fi, 1); continue; }
      ctx.globalAlpha = f.life;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
  }
  animate();
}

function cleanupCelebration() {
  if (celebrationCleanup) celebrationCleanup();
}
