// 情侣飞行棋 - 游戏逻辑

const BOARD_SIZE = 15;
const TOTAL_CELLS = 56;

const PATH = [
  [14,0],[14,1],[14,2],[14,3],[14,4],[14,5],[14,6],[14,7],
  [14,8],[14,9],[14,10],[14,11],[14,12],[14,13],[14,14],
  [13,14],[12,14],[11,14],[10,14],[9,14],[8,14],[7,14],
  [6,14],[5,14],[4,14],[3,14],[2,14],[1,14],
  [0,14],[0,13],[0,12],[0,11],[0,10],[0,9],[0,8],
  [0,7],[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],
  [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
  [8,0],[9,0],[10,0],[11,0],[12,0],[13,0],
];

const PATH_MAP = {};
PATH.forEach(([r, c], i) => { PATH_MAP[`${r},${c}`] = i; });

let gameState;
let currentGeneration = 0;
let isAnimating = false;
let cellPosCache = null;

// ============ 默认事件 ============

const DEFAULT_EVENTS = [
  "起点！说一句我爱你","给对方一个拥抱","夸对方三个优点","亲一下对方",
  "一起拍张合照","模仿对方的招牌动作","唱一句情歌给对方听","说一件对方做过让你感动的事",
  "给对方比心","原地转一圈逗对方笑","大冒险：亲对方额头","牵手30秒",
  "说出对方的三个昵称","回忆第一次见面的场景","说一段土味情话","休息站~靠在对方肩上",
  "真心话：最喜欢对方什么？","给对方一个飞吻","原地停留，享受二人时光","模仿动物叫声逗对方笑",
  "大冒险：抱对方转一圈","说一句未来的承诺","一起做个鬼脸自拍","夸对方今天好好看",
  "给对方捏捏手","说出你们的纪念日","休息站~闭眼微笑10秒","模仿对方说话的语气",
  "真心话：想和对方去哪里旅行？","给对方一个公主抱（或尝试）","一起摆个情侣pose","唱首对方喜欢的歌",
  "说三个想和对方一起做的事","原地停留，互相凝视10秒","给对方捶捶背","大冒险：学对方走路",
  "回忆最甜蜜的一次约会","休息站~头靠头休息","说出对方最可爱的习惯","给对方一个长长的拥抱",
  "真心话：对方做过最浪漫的事？","一起跳一段舞","给对方写一句话（手机备忘录）","模仿对方生气的样子",
  "快到终点了！说一句感谢的话","夸对方是全世界最好的","一起看星星许个愿","终点在望！说一句我爱你",
  "最后一步，一起冲！","到家了！亲一下庆祝","说一句我爱你","给对方一个熊抱",
  "一起拍张合照留念","真心话：说出对方的一个秘密","大冒险：模仿对方走路","休息站~头靠头休息一下",
];

// 事件预设方案
const FUNNY_EVENTS = [
  "对着镜子做个夸张鬼脸","用唱的方式说一句话","模仿动物叫声10秒","表演一段即兴舞蹈",
  "用方言说一句我爱你","原地转5圈然后走直线","模仿对方最经典的口头禅","讲一个冷笑话直到对方笑",
  "用屁股写自己的名字","倒着说一遍对方的名字","学企鹅走路绕一圈","用夸张语气做广告推销对方",
  "做10个俯卧撑（或深蹲）","闭眼转圈后指一个方向","用外语说一句情话","假装自己是机器人走路",
  "单脚站立读完一段绕口令","连续做5个夸张表情","用歌剧腔唱一句歌词","模仿一位名人说话",
  "把袜子穿在手上10秒","对着风扇说'我爱你'听回声","用搞笑方式吃一块饼干","学树懒说话和动作",
  "说一个绕口令快一点","跳一支自创的舞蹈","用鼻子哼一首歌让对方猜","做鬼脸自拍并设为头像（可撤回）",
  "模仿对方生气时的样子","用脚趾夹起一个小物件","做螃蟹走路横着走一圈","用撒娇的语气命令对方",
  "头上顶一本书走5步","闭眼摸对方的脸猜表情","用极慢动作做一件事","学招财猫挥手说欢迎光临",
  "把气球夹在两腿之间走路","一边拍肚子一边摸头","用纸卷当话筒采访对方","模仿一个卡通角色",
  "假裝自己是餐厅服务员服务对方","用夸张的悲伤语气讲开心的事","原地高抬腿20个","学小鸡走路并咯咯叫",
  "用超快的语速说一段绕口令","做一个定格pose保持10秒","闭眼单脚站立念诗","模仿对方的招牌动作",
  "用动作比划一个词让对方猜","假装自己是一尊雕像","用吸管喝完一杯水（如果有）","学猩猩走路并拍胸脯",
  "用夸张表情读出手机第一条消息","单脚跳着去拿一个东西","学猫叫三声并舔手","做鸭子走路绕一圈",
  "用水杯当麦克风唱一首歌",
];

const ADVENTURE_EVENTS = [
  "闭眼让对方牵你走10步","在对方耳边说一个小秘密","一起做一个高难度合影pose","对视30秒不许笑出声",
  "跳20个开合跳","单脚站立说一段绕口令","给对方一个突然的拥抱","一起唱一首歌的副歌并录音",
  "说出一个从未告诉别人的秘密","做15个俯卧撑或深蹲","一起摆一个情侣瑜伽姿势","在窗边对着外面大喊一句话",
  "互相喂对方吃一样东西","一起拍一段15秒的短视频","计时平板支撑30秒","用身体拼出一个爱心形状",
  "闭上眼睛让对方画你的脸","给对方做一次肩颈按摩","一起做一次深呼吸冥想30秒","原地快速踏步20秒",
  "给对方编一个即兴小故事","单膝跪地深情说一句台词","一起做一次高五击掌加指响","闭眼感受对方的呼吸10秒",
  "说出你最想去的地方并约定","用一根手指做俯卧撑（尝试）","围着桌子快走一圈","一起做一个手影动物",
  "模仿一位运动员的庆祝动作","给对方一个背背或抱抱","一起倒数321跳一个舞步","背对背互相靠着坐",
  "闭眼转三圈后走向对方","一起模仿一部电影经典场景","给对方做一个纸折的小礼物","比谁能单脚站更久",
  "互相猜拳输的做5个深蹲","一起哼一首歌直到两人同步","用身体挡住对方眼睛让TA猜在哪","一起做一个托举动作（安全第一）",
  "给对方写一句鼓励的话贴在墙上","一起跟着音乐随意舞动","面对面做一次深呼吸同步训练","轮流说一件事然后一起做",
  "比赛谁憋气更久","互相猜对方手机里第三张照片","一起做一个多米诺骨牌（如果有）","给对方捶背30秒",
  "用一张纸折一个东西送给对方","一起做一次真心话大冒险","闭眼感受对方手掌的温度","一起大声笑10秒",
  "说出对方最让你骄傲的一件事","一起跳一支交谊舞步","给对方一个公主抱（或尝试）","比赛谁先笑出声",
  "拥抱10秒然后在耳边说一句悄悄话",
];

// 事件预设方案
const EVENT_PRESETS = {
  romantic: { name: "💕 浪漫版", events: DEFAULT_EVENTS },
  funny:    { name: "😂 搞笑版", events: FUNNY_EVENTS },
  adventure: { name: "🔥 冒险版", events: ADVENTURE_EVENTS },
};

function getCurrentPreset() {
  return localStorage.getItem("ludo_event_preset") || null;
}

function setCurrentPreset(name) {
  if (name) localStorage.setItem("ludo_event_preset", name);
  else localStorage.removeItem("ludo_event_preset");
}

// 从localStorage加载事件，没有则用默认（或当前预设）
function loadEvents() {
  // 先看是否有自定义保存的事件
  try {
    const saved = localStorage.getItem("ludo_events");
    if (saved) {
      const arr = JSON.parse(saved);
      if (arr.length === TOTAL_CELLS) {
        // 有自定义事件时清除预设标记
        localStorage.removeItem("ludo_event_preset");
        return arr;
      }
    }
  } catch (e) {}
  // 没有自定义事件，尝试加载当前预设
  const preset = getCurrentPreset();
  if (preset && EVENT_PRESETS[preset]) {
    return [...EVENT_PRESETS[preset].events];
  }
  return [...DEFAULT_EVENTS];
}

let CELL_EVENTS = loadEvents();

// ============ 音效 ============

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.08;

    if (type === "dice") {
      osc.frequency.value = 800; osc.type = "square";
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start(); osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === "move") {
      osc.frequency.value = 500; osc.type = "sine";
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === "event") {
      osc.frequency.value = 600; osc.type = "triangle";
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === "win") {
      osc.frequency.value = 523; osc.type = "sine";
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start(); osc.stop(audioCtx.currentTime + 0.6);
      setTimeout(() => {
        const o2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        o2.connect(g2); g2.connect(audioCtx.destination);
        g2.gain.value = 0.08;
        o2.frequency.value = 659; o2.type = "sine";
        g2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        o2.start(); o2.stop(audioCtx.currentTime + 0.5);
      }, 200);
    }
  } catch (e) {}
}

// ============ 触觉反馈 ============

function vibrate(pattern) {
  try { navigator.vibrate(pattern); } catch (e) {}
}

// ============ 主题系统 ============

function applyTheme(theme) {
  document.body.classList.remove("dark", "lumu");
  if (theme === "dark") document.body.classList.add("dark");
  else if (theme === "lumu") document.body.classList.add("lumu");
  localStorage.setItem("ludo_theme", theme);
  updateThemeBtn();
}

function updateThemeBtn() {
  const theme = localStorage.getItem("ludo_theme") || "light";
  const btn = document.getElementById("themeBtn");
  if (theme === "light") btn.textContent = "☀️ 浅色";
  else if (theme === "dark") btn.textContent = "🌙 深色";
  else if (theme === "lumu") btn.innerHTML = '<span class="heart-gradient">♥</span> 橹穆';
}

function initTheme() {
  // 兼容旧版 ludo_dark 键
  const oldDark = localStorage.getItem("ludo_dark");
  let theme = localStorage.getItem("ludo_theme");
  if (!theme && oldDark !== null) {
    theme = oldDark === "1" ? "dark" : "light";
    localStorage.setItem("ludo_theme", theme);
    localStorage.removeItem("ludo_dark");
  }
  applyTheme(theme || "light");
}

function toggleTheme() {
  const theme = localStorage.getItem("ludo_theme") || "light";
  const next = theme === "light" ? "dark" : theme === "dark" ? "lumu" : "light";
  applyTheme(next);
  vibrate(30);
}

// ============ 游戏统计 ============

function loadStats() {
  try {
    const saved = localStorage.getItem("ludo_stats");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { total: 0, p1Wins: 0, p2Wins: 0 };
}

let gameStats = loadStats();

function saveStats() {
  localStorage.setItem("ludo_stats", JSON.stringify(gameStats));
}

function updateStats(winnerId) {
  gameStats.total++;
  if (winnerId === 1) gameStats.p1Wins++;
  else if (winnerId === 2) gameStats.p2Wins++;
  saveStats();
}

function renderStats() {
  const p1 = playerData[1];
  const p2 = playerData[2];
  document.getElementById("statsContent").innerHTML = `
    <div class="stat-row"><span class="stat-label">总对局</span><span class="stat-value">${gameStats.total}</span></div>
    <div class="stat-row"><span class="stat-label">${p1.icon} ${p1.name} 胜利</span><span class="stat-value">${gameStats.p1Wins}</span></div>
    <div class="stat-row"><span class="stat-label">${p2.icon} ${p2.name} 胜利</span><span class="stat-value">${gameStats.p2Wins}</span></div>
  `;
}

function openStats() {
  renderStats();
  document.getElementById("statsOverlay").classList.add("show");
  vibrate(20);
}

function closeStats(e) {
  if (e && e.target !== document.getElementById("statsOverlay")) return;
  document.getElementById("statsOverlay").classList.remove("show");
}

function resetStats() {
  if (!confirm("确定要重置所有统计数据吗？")) return;
  gameStats = { total: 0, p1Wins: 0, p2Wins: 0 };
  saveStats();
  renderStats();
  showMessage("统计数据已重置");
  vibrate([30, 50, 30]);
}

// ============ 游戏状态 ============

let firstPlayer = parseInt(localStorage.getItem("ludo_first") || "1") || 1;

// ============ 玩家自定义数据 ============

const DEFAULT_PLAYERS = {
  1: { name: "鹿角虫", icon: "🐺" },
  2: { name: "小曦曦", icon: "🐷" },
};

function loadPlayers() {
  try {
    const saved = localStorage.getItem("ludo_players");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
}

let playerData = loadPlayers();

function savePlayers() {
  localStorage.setItem("ludo_players", JSON.stringify(playerData));
}

function updatePlayerDisplay() {
  [1, 2].forEach(pid => {
    const el = document.getElementById(`playerName${pid}`);
    if (el) el.textContent = `${playerData[pid].icon} ${playerData[pid].name}`;
  });
}

function openPlayerEditor() {
  document.getElementById("p1Name").value = playerData[1].name;
  document.getElementById("p1Icon").value = playerData[1].icon;
  document.getElementById("p2Name").value = playerData[2].name;
  document.getElementById("p2Icon").value = playerData[2].icon;
  document.getElementById("playerEditorOverlay").classList.add("show");
  vibrate(20);
}

function closePlayerEditor(e) {
  if (e && e.target !== document.getElementById("playerEditorOverlay")) return;
  document.getElementById("playerEditorOverlay").classList.remove("show");
}

function savePlayerEditor() {
  const n1 = document.getElementById("p1Name").value.trim() || DEFAULT_PLAYERS[1].name;
  const i1 = document.getElementById("p1Icon").value.trim() || DEFAULT_PLAYERS[1].icon;
  const n2 = document.getElementById("p2Name").value.trim() || DEFAULT_PLAYERS[2].name;
  const i2 = document.getElementById("p2Icon").value.trim() || DEFAULT_PLAYERS[2].icon;
  playerData = { 1: { name: n1, icon: i1 }, 2: { name: n2, icon: i2 } };
  savePlayers();
  updatePlayerDisplay();
  updateFirstBtn();
  renderPhotos();
  // 正在游戏中则刷新棋盘上的棋子
  if (gameState) {
    gameState.players[1].name = n1;
    gameState.players[1].icon = i1;
    gameState.players[2].name = n2;
    gameState.players[2].icon = i2;
    placePieces();
  }
  document.getElementById("playerEditorOverlay").classList.remove("show");
  showMessage("玩家信息已更新！");
  vibrate([30, 50, 30]);
}

function newGameState() {
  return {
    currentPlayer: firstPlayer,
    diceValue: 0,
    isRolling: false,
    gameOver: false,
    players: {
      1: { pos: -1, icon: playerData[1].icon, name: playerData[1].name, startCell: 0, netMove: 0 },
      2: { pos: -1, icon: playerData[2].icon, name: playerData[2].name, startCell: 0, netMove: 0 }
    }
  };
}

// ============ 棋盘 ============

function initBoard() {
  const board = document.getElementById("gameBoard");
  board.innerHTML = "";
  cellPosCache = null;

  const pathSet = new Set(PATH.map(([r, c]) => `${r},${c}`));
  const decorations = {
    "7,7": "❤️", "4,4": "💕", "4,10": "💑", "10,4": "🏠",
    "10,10": "🌹", "5,7": "⭐", "9,7": "⭐", "7,5": "⭐", "7,9": "⭐",
  };

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${row}-${col}`;
      const key = `${row},${col}`;

      if (pathSet.has(key)) {
        const pathIndex = PATH_MAP[key];
        cell.textContent = pathIndex;
        cell.classList.add("on-path");
        cell.style.setProperty("--i", pathIndex);
        // 四段路径不同底色
        if (pathIndex < 14) cell.classList.add("section-0");
        else if (pathIndex < 28) cell.classList.add("section-1");
        else if (pathIndex < 42) cell.classList.add("section-2");
        else cell.classList.add("section-3");
        if (pathIndex === 0) cell.classList.add("start-p1");
      } else if (row >= 2 && row <= 12 && col >= 2 && col <= 12) {
        cell.classList.add("center-cell");
        if (decorations[key]) {
          cell.textContent = decorations[key];
          cell.classList.add("decoration");
          if (key === "7,7") cell.classList.add("heart");
        }
      }
      board.appendChild(cell);
    }
  }
  placePieces();
}

function buildCellPosCache() {
  const board = document.querySelector(".game-board");
  if (!board) return;
  const boardRect = board.getBoundingClientRect();
  const style = getComputedStyle(board);
  const border = parseFloat(style.borderLeftWidth) || 0;
  const padding = parseFloat(style.paddingLeft) || 0;

  cellPosCache = {};
  PATH.forEach(([row, col], i) => {
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (cell) {
      const r = cell.getBoundingClientRect();
      const ps = r.width * 0.8;
      cellPosCache[i] = {
        x: r.left - boardRect.left - border - padding + r.width / 2 - ps / 2,
        y: r.top - boardRect.top - border - padding + r.height / 2 - ps / 2,
      };
    }
  });
}

function getCellPos(pathIndex) {
  if (!cellPosCache) buildCellPosCache();
  return cellPosCache[pathIndex] || { x: 0, y: 0 };
}

// ============ 棋子 ============

function placePieces() {
  if (isAnimating) return;
  [1, 2].forEach(pid => {
    const player = gameState.players[pid];
    const old = document.querySelector(`.piece.p${pid}:not(.moving)`);
    if (old) old.remove();
    if (player.pos === -1) return;
    const [row, col] = PATH[player.pos];
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (cell) {
      const piece = document.createElement("div");
      piece.className = `piece p${pid}`;
      piece.textContent = player.icon;
      cell.appendChild(piece);
    }
  });
}

function animateMove(playerId, fromPos, toPos, callback, forward) {
  if (forward === undefined) forward = true;
  const gen = currentGeneration;
  const player = gameState.players[playerId];
  const stepDelay = 350;
  isAnimating = true;
  if (!cellPosCache) buildCellPosCache();

  const steps = [];
  if (fromPos !== toPos) {
    let cur = fromPos;
    let safety = TOTAL_CELLS + 1;
    while (cur !== toPos && safety > 0) {
      cur = forward ? (cur + 1) % TOTAL_CELLS : (cur - 1 + TOTAL_CELLS) % TOTAL_CELLS;
      steps.push(cur);
      safety--;
    }
  }
  console.log(`[动画] from=${fromPos} to=${toPos}, steps=${steps.length}, steps=[${steps}]`);

  document.querySelectorAll(`.piece.p${playerId}:not(.moving)`).forEach(p => p.remove());

  const movingPiece = document.createElement("div");
  movingPiece.className = `piece p${playerId} moving`;
  movingPiece.textContent = player.icon;
  const board = document.querySelector(".game-board");
  board.appendChild(movingPiece);

  const startPos = fromPos === -1 ? toPos : fromPos;
  const s = getCellPos(startPos);
  movingPiece.style.left = s.x + "px";
  movingPiece.style.top = s.y + "px";

  let stepIndex = 0;
  function moveStep() {
    if (gen !== currentGeneration) { movingPiece.remove(); isAnimating = false; return; }
    if (stepIndex >= steps.length) {
      isAnimating = false;
      placePieces();
      movingPiece.remove();
      vibrate(20);
      if (callback) callback();
      return;
    }
    const pos = getCellPos(steps[stepIndex]);
    movingPiece.style.left = pos.x + "px";
    movingPiece.style.top = pos.y + "px";
    stepIndex++;
    setTimeout(moveStep, stepDelay);
  }

  requestAnimationFrame(() => { setTimeout(moveStep, stepDelay); });
}

// ============ 骰子 ============

// 骰子点数布局 (3x3网格, 1=有点, 0=无点)
const DICE_LAYOUT = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

// 渲染骰子点数 — 旋转立方体显示对应面
function renderDice(value) {
  const cube = document.getElementById("diceCube");
  if (!cube) return;
  const rotations = {
    1: "rotateX(90deg)",
    2: "rotateY(0deg)",
    3: "rotateY(90deg)",
    4: "rotateY(-90deg)",
    5: "rotateY(180deg)",
    6: "rotateX(-90deg)",
  };
  cube.style.transform = rotations[value] || "rotateY(0deg)";
}

// 初始化骰子 — 创建3D立方体
function initDice() {
  const dice = document.getElementById("dice");
  dice.innerHTML = "";
  const cube = document.createElement("div");
  cube.className = "dice-cube";
  cube.id = "diceCube";
  for (let val = 1; val <= 6; val++) {
    const face = document.createElement("div");
    face.className = `dice-face face-${val}`;
    DICE_LAYOUT[val].forEach(has => {
      const pip = document.createElement("div");
      pip.className = has ? "pip on" : "pip";
      face.appendChild(pip);
    });
    cube.appendChild(face);
  }
  dice.appendChild(cube);
  renderDice(1);
}

function rollDice() {
  if (gameState.isRolling || gameState.gameOver || isAnimating) return;
  gameState.isRolling = true;
  const gen = currentGeneration;
  const cube = document.getElementById("diceCube");

  // 先决定点数
  gameState.diceValue = Math.floor(Math.random() * 6) + 1;
  playSound("dice");
  vibrate([50, 30, 50]);

  // 纯JS 3D旋转动画 — 快速随机旋转，最后平稳停到目标面
  cube.style.transition = "none";
  let count = 0;
  const spinInterval = setInterval(() => {
    if (gen !== currentGeneration) { clearInterval(spinInterval); return; }
    count++;
    if (count <= 10) {
      const rx = Math.floor(Math.random() * 720);
      const ry = Math.floor(Math.random() * 720);
      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
    if (count > 10) {
      clearInterval(spinInterval);
      cube.style.transition = "transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)";
      renderDice(gameState.diceValue);
      showMessage(`掷出了 ${gameState.diceValue} 点！`);
      gameState.isRolling = false;
      vibrate(80);

      setTimeout(() => {
        if (gen !== currentGeneration) return;
        movePiece(gameState.currentPlayer);
      }, 550);
    }
  }, 85);
}

// ============ 移动逻辑 ============

function movePiece(playerId) {
  if (gameState.gameOver) return;
  if (playerId !== gameState.currentPlayer) return;
  const gen = currentGeneration;
  const player = gameState.players[playerId];
  const dice = gameState.diceValue;

  console.log(`[movePiece] dice=${dice}, player.pos=${player.pos}`);

  if (player.pos === -1) {
    const newPos = (player.startCell + dice) % TOTAL_CELLS;
    player.netMove = dice;
    player.pos = newPos;
    console.log(`[出发] startCell=${player.startCell} + dice=${dice} = newPos=${newPos}`);
    showMessage(`${player.name} 掷了 ${dice}，出发！`);
    animateMove(playerId, player.startCell, newPos, () => {
      if (gen !== currentGeneration) return;
      afterMove(playerId, newPos, CELL_EVENTS[newPos] || null, gen);
    }, true);
    return;
  }

  const oldPos = player.pos;
  const newPos = (player.pos + dice) % TOTAL_CELLS;
  player.netMove += dice;
  console.log(`[正常] oldPos=${oldPos} + dice=${dice} = newPos=${newPos}, steps=${(newPos - oldPos + TOTAL_CELLS) % TOTAL_CELLS}`);
  showMessage(`${player.name} 掷了 ${dice}`);

  if (player.netMove >= TOTAL_CELLS) {
    const finalPos = TOTAL_CELLS - 1;
    player.pos = finalPos;
    if (oldPos === finalPos) {
      // 已经停在终点格，直接胜利
      gameState.gameOver = true;
      showWin(player.name);
    } else {
      animateMove(playerId, oldPos, finalPos, () => {
        gameState.gameOver = true;
        showWin(player.name);
      }, true);
    }
    return;
  }

  player.pos = newPos;
  animateMove(playerId, oldPos, newPos, () => {
    if (gen !== currentGeneration) return;
    afterMove(playerId, newPos, CELL_EVENTS[newPos] || null, gen);
  }, true);
}

function afterMove(playerId, pos, eventText, gen) {
  if (gen !== currentGeneration) return;
  if (eventText) {
    playSound("event");
    vibrate([30, 50, 30]);
    showPopup(eventText, playerId);
    setTimeout(() => {
      if (gen !== currentGeneration) return;
      placePieces();
      nextTurn();
    }, 1500);
  } else {
    placePieces();
    nextTurn();
  }
}

// ============ 胜利 ============

function showWin(name) {
  // 更新统计
  const winnerId = Object.entries(gameState.players).find(([, p]) => p.name === name)?.[0];
  if (winnerId) updateStats(parseInt(winnerId));

  playSound("win");
  vibrate([100, 50, 100, 50, 200]);
  showMessage(`恭喜！${name} 走完一圈，获胜了！🎉`);

  // 胜利弹窗
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay win-overlay";
  const box = document.createElement("div");
  box.className = "popup-box win-box";
  box.innerHTML = `<div style="margin-bottom:16px">恭喜！${name} 走完一圈，获胜了！🎉</div><div style="display:flex;gap:10px"><button class="editor-btn save play-again-btn" onclick="resetGame()">再来一局</button><button class="editor-btn cancel" onclick="this.closest('.popup-overlay').remove()">关闭</button></div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // 旧版emoji庆祝保留
  const cele = document.createElement("div");
  cele.className = "celebration";
  const emojis = ["🎉", "🎊", "❤️", "💕", "⭐", "🌹", "✨"];
  for (let i = 0; i < 20; i++) {
    const span = document.createElement("span");
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.left = Math.random() * 100 + "%";
    span.style.animationDelay = Math.random() * 2 + "s";
    span.style.animationDuration = (1.5 + Math.random() * 2) + "s";
    cele.appendChild(span);
  }
  document.body.appendChild(cele);
  setTimeout(() => cele.remove(), 5000);

  // === Canvas 庆祝特效 ===
  const canvas = document.createElement("canvas");
  canvas.className = "celebration-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const colors = ["#ff6b6b","#feca57","#48dbfb","#ff9ff3","#54a0ff","#5f27cd","#01a3a4","#f368e0","#ff6348"];
  let confetti = [];
  let fireworks = [];
  let stars = [];
  let startTime = Date.now();
  let running = true;

  // 彩带
  for (let i = 0; i < 200; i++) {
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

  // 星星
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1 + Math.random() * 2,
      a: Math.random(),
      da: 0.02 + Math.random() * 0.03,
    });
  }

  function spawnFirework() {
    const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const y = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      fireworks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 1.5 + Math.random() * 2.5,
        decay: 0.008 + Math.random() * 0.015,
      });
    }
  }

  let fireworkTick = 0;
  function animate() {
    if (!running) return;
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > 7) {
      running = false;
      canvas.remove();
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 闪烁星星背景
    stars.forEach(s => {
      s.a += s.da;
      if (s.a > 1 || s.a < 0.1) s.da = -s.da;
      ctx.globalAlpha = s.a * 0.6;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 彩带
    confetti.forEach(c => {
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

    // 烟花
    fireworkTick++;
    if (fireworkTick % 12 === 0 && elapsed < 4.5) spawnFirework();

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const f = fireworks[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.04;
      f.life -= f.decay;
      if (f.life <= 0) { fireworks.splice(i, 1); continue; }
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

// ============ 重置 ============

function resetGame() {
  currentGeneration++;
  isAnimating = false;
  document.querySelector(".popup-overlay")?.remove();
  document.querySelector(".celebration")?.remove();
  document.querySelectorAll(".piece.moving").forEach(p => p.remove());
  gameState = newGameState();
  initBoard();
  initDice();
  updateTurnDisplay();
  showMessage("游戏已重新开始，点击骰子");
  vibrate(30);
}

// ============ 事件编辑器 ============

function openEditor() {
  const list = document.getElementById("editorList");
  list.innerHTML = "";
  CELL_EVENTS.forEach((text, i) => {
    const item = document.createElement("div");
    item.className = "editor-item";
    item.innerHTML = `<label>${i}</label><input type="text" value="${text.replace(/"/g, '&quot;')}" data-index="${i}">`;
    list.appendChild(item);
  });
  renderPresetBar();
  document.getElementById("editorOverlay").classList.add("show");
  vibrate(20);
}

function closeEditor(e) {
  if (e && e.target !== document.getElementById("editorOverlay")) return;
  document.getElementById("editorOverlay").classList.remove("show");
}

function saveEvents() {
  const inputs = document.querySelectorAll("#editorList input");
  inputs.forEach(input => {
    const i = parseInt(input.dataset.index);
    CELL_EVENTS[i] = input.value || DEFAULT_EVENTS[i];
  });
  localStorage.setItem("ludo_events", JSON.stringify(CELL_EVENTS));
  setCurrentPreset(null);
  document.getElementById("editorOverlay").classList.remove("show");
  showMessage("事件已保存！");
  vibrate([30, 50, 30]);
}

function resetEvents() {
  CELL_EVENTS = [...DEFAULT_EVENTS];
  localStorage.setItem("ludo_events", JSON.stringify(CELL_EVENTS));
  setCurrentPreset(null);
  openEditor();
  showMessage("已恢复默认事件");
  vibrate(30);
}

function applyPreset(name) {
  if (!EVENT_PRESETS[name]) return;
  CELL_EVENTS = [...EVENT_PRESETS[name].events];
  localStorage.removeItem("ludo_events");
  setCurrentPreset(name);
  openEditor();
  showMessage(`已切换到当前预设`);
  vibrate([30, 50, 30]);
}

function loadPresetNames() {
  try { return JSON.parse(localStorage.getItem("ludo_preset_names")) || {}; } catch (e) {}
  return {};
}

function savePresetNames(names) {
  localStorage.setItem("ludo_preset_names", JSON.stringify(names));
}

function renderPresetBar() {
  const bar = document.getElementById("presetBar");
  if (!bar) return;
  bar.innerHTML = "";
  const customNames = loadPresetNames();
  const current = getCurrentPreset();
  Object.entries(EVENT_PRESETS).forEach(([key, preset]) => {
    const displayName = customNames[key] || preset.name;
    const wrap = document.createElement("div");
    wrap.className = "preset-item";
    const btn = document.createElement("button");
    btn.className = "preset-btn" + (key === current ? " active" : "");
    btn.textContent = "应用";
    btn.onclick = () => applyPreset(key);
    const input = document.createElement("input");
    input.className = "preset-name-input";
    input.value = displayName;
    input.dataset.preset = key;
    input.addEventListener("change", function () {
      const names = loadPresetNames();
      const trimmed = this.value.trim();
      names[key] = trimmed || EVENT_PRESETS[key].name;
      if (!trimmed) this.value = EVENT_PRESETS[key].name;
      savePresetNames(names);
    });
    wrap.appendChild(btn);
    wrap.appendChild(input);
    bar.appendChild(wrap);
  });
}

// ============ 照片编辑器 ============

let currentPhotoPlayer = 1;

function loadPhotos() {
  try {
    const saved = localStorage.getItem("ludo_photos");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { 1: "", 2: "" };
}

let photos = loadPhotos();

function renderPhotos() {
  [1, 2].forEach(pid => {
    const card = document.getElementById(`photo${pid}`);
    const url = photos[pid];
    const p = playerData[pid];
    if (url) {
      card.innerHTML = `<img src="${url}" alt="玩家${pid}" onerror="renderPhotos()">`;
      const label = document.createElement("span");
      label.className = "photo-label";
      label.textContent = p.name;
      card.appendChild(label);
    } else {
      card.innerHTML = `<div class="photo-placeholder">${p.icon}</div><span class="photo-label">${p.name}</span>`;
    }
  });
}

function openPhotoEditor(pid) {
  currentPhotoPlayer = pid;
  const title = document.getElementById("photoEditorTitle");
  title.textContent = `设置${playerData[pid]?.name || "玩家" + pid}的照片`;
  const input = document.getElementById("photoUrlInput");
  input.value = photos[pid] || "";
  updatePhotoPreview();
  document.getElementById("photoEditorOverlay").classList.add("show");
  vibrate(20);
}

function closePhotoEditor(e) {
  if (e && e.target !== document.getElementById("photoEditorOverlay")) return;
  document.getElementById("photoEditorOverlay").classList.remove("show");
}

function updatePhotoPreview() {
  const preview = document.getElementById("photoPreview");
  const url = document.getElementById("photoUrlInput").value.trim();
  if (url) {
    preview.innerHTML = `<img src="${url}" onerror="this.parentElement.textContent='加载失败'">`;
  } else {
    preview.innerHTML = currentPhotoPlayer === 1 ? "🐺" : "🐷";
  }
}

function savePhoto() {
  const url = document.getElementById("photoUrlInput").value.trim();
  photos[currentPhotoPlayer] = url;
  localStorage.setItem("ludo_photos", JSON.stringify(photos));
  renderPhotos();
  document.getElementById("photoEditorOverlay").classList.remove("show");
  showMessage("照片已保存！");
  vibrate([30, 50, 30]);
}

function clearPhoto() {
  photos[currentPhotoPlayer] = "";
  localStorage.setItem("ludo_photos", JSON.stringify(photos));
  renderPhotos();
  document.getElementById("photoEditorOverlay").classList.remove("show");
  showMessage("照片已清除");
  vibrate(30);
}

function handlePhotoFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const maxSize = 200;
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      photos[currentPhotoPlayer] = dataUrl;
      localStorage.setItem("ludo_photos", JSON.stringify(photos));
      renderPhotos();
      document.getElementById("photoEditorOverlay").classList.remove("show");
      showMessage("照片已保存！");
      vibrate([30, 50, 30]);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============ UI ============

function showPopup(text, playerId) {
  document.querySelector(".popup-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  const box = document.createElement("div");
  box.className = "popup-box";
  box.textContent = text;
  if (playerId) {
    const color = playerId === 1 ? "#e53935" : "#42a5f5";
    box.style.borderColor = color;
  }
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.addEventListener("click", () => overlay.remove());
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 3000);
}

function nextTurn() {
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
  updateTurnDisplay();
  vibrate(15);
}

function updateTurnDisplay() {
  const p1 = document.querySelector(".player1");
  const p2 = document.querySelector(".player2");
  if (gameState.currentPlayer === 1) {
    p1.classList.add("active");
    p2.classList.remove("active");
  } else {
    p2.classList.add("active");
    p1.classList.remove("active");
  }
}

function showMessage(msg) {
  document.getElementById("gameMessage").textContent = msg;
}

// ============ 动态背景 ============

let bgAnimOn = false;

function initBgAnimation() {
  if (localStorage.getItem("ludo_bg_anim") === "1") {
    startBgAnimation();
  }
  updateBgBtn();
}

function toggleBgAnimation() {
  if (bgAnimOn) {
    stopBgAnimation();
  } else {
    startBgAnimation();
  }
  updateBgBtn();
  localStorage.setItem("ludo_bg_anim", bgAnimOn ? "1" : "0");
  vibrate(20);
}

function updateBgBtn() {
  document.getElementById("bgBtn").textContent = bgAnimOn ? "💗 背景" : "🤍 背景";
}

function startBgAnimation() {
  bgAnimOn = true;
  const container = document.getElementById("bgAnimation");
  container.innerHTML = "";
  container.classList.add("active");
  const symbols = ["❤️", "💕", "💗", "🌸", "🌺", "💖", "🩷"];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement("div");
    el.className = "float-element";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + "%";
    el.style.animationDelay = Math.random() * 12 + "s";
    el.style.animationDuration = (12 + Math.random() * 10) + "s";
    el.style.fontSize = (14 + Math.random() * 18) + "px";
    const opacity = 0.12 + Math.random() * 0.2;
    el.style.setProperty("--float-opacity", opacity);
    el.style.opacity = opacity;
    container.appendChild(el);
  }
}

function stopBgAnimation() {
  bgAnimOn = false;
  document.getElementById("bgAnimation").classList.remove("active");
}

// ============ 先手选择 ============

function updateFirstBtn() {
  const btn = document.getElementById("firstBtn");
  const icon = playerData[firstPlayer]?.icon || "🐺";
  btn.textContent = "先手: " + icon;
}

function toggleFirst() {
  firstPlayer = firstPlayer === 1 ? 2 : 1;
  localStorage.setItem("ludo_first", String(firstPlayer));
  updateFirstBtn();
  resetGame();
}

// ============ 启动 ============

initTheme();
initBgAnimation();
gameState = newGameState();
initBoard();
initDice();
updateTurnDisplay();
updateFirstBtn();
updatePlayerDisplay();
renderPhotos();

document.getElementById("photoUrlInput").addEventListener("input", updatePhotoPreview);
document.getElementById("photoFileInput").addEventListener("change", function(e) {
  if (e.target.files[0]) handlePhotoFile(e.target.files[0]);
});
