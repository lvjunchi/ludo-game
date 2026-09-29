// 情侣飞行棋 - 入口文件

// ---- 共享状态 ----
var gameState = null;
var currentGeneration = 0;
var firstPlayer = parseInt(localStorage.getItem('ludo_first') || '1') || 1;
var playerData = loadPlayers();
var gameStats = loadStats();
var gameInitialized = false;

// ---- 状态访问 ----
function getCurrentGenRef() { return { get current() { return currentGeneration; } }; }

// ---- 游戏控制 ----
function newGameState() {
  return {
    currentPlayer: firstPlayer,
    diceValue: 0,
    isRolling: false,
    gameOver: false,
    isAnimating: false,
    isTurnBusy: false,
    pendingEvent: null,
    players: {
      1: { pos: -1, icon: playerData[1].icon, name: playerData[1].name, startCell: 0, netMove: 0 },
      2: { pos: -1, icon: playerData[2].icon, name: playerData[2].name, startCell: 0, netMove: 0 }
    }
  };
}

function resetGame() {
  currentGeneration++;
  cleanupCelebration();
  var popup = document.querySelector(".popup-overlay");
  if (popup) popup.remove();
  var cele = document.querySelector(".celebration");
  if (cele) cele.remove();
  var consCele = document.querySelector(".consolation-cele");
  if (consCele) consCele.remove();
  var consMsg = document.querySelector(".consolation-msg");
  if (consMsg) consMsg.remove();
  var canvas = document.querySelector(".celebration-canvas");
  if (canvas) canvas.remove();
  var movingPieces = document.querySelectorAll(".piece.moving");
  for (var i = 0; i < movingPieces.length; i++) movingPieces[i].remove();
  gameState = newGameState();
  initBoard(gameState);
  initDice();
  updateTurnDisplay();
  showMessage("游戏已重新开始，点击骰子");
  vibrate(30);
}

function updateTurnDisplay() {
  var controls = document.querySelector('.controls');
  if (!controls) return;
  if (gameState.currentPlayer === 1) {
    controls.classList.add('p1-turn');
    controls.classList.remove('p2-turn');
  } else {
    controls.classList.add('p2-turn');
    controls.classList.remove('p1-turn');
  }
}

function nextTurn() {
  gameState.isTurnBusy = false;
  gameState.pendingEvent = null;
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
  updateTurnDisplay();
  vibrate(15);
}

function updatePlayerDisplay() {
  forEach([1, 2], function(pid) {
    var el = document.getElementById("playerName" + pid);
    if (el) el.textContent = playerData[pid].icon + " " + playerData[pid].name;
  });
}

function updateStats(winnerId) {
  gameStats.total++;
  if (winnerId === 1) gameStats.p1Wins++;
  else if (winnerId === 2) gameStats.p2Wins++;
  saveStats(gameStats);
  checkAchievements(winnerId, gameStats).catch(function() {});
}

// ---- 掷骰子包装 ----
function rollDice() {
  if (document.querySelector('.game-container').style.display === 'none') return;
  if (document.querySelector('.editor-overlay.show')) return;
  _rollDice(gameState, getCurrentGenRef(), function(playerId) {
    movePiece(playerId, gameState, getCurrentGenRef(), nextTurn, updateStats, resetGame);
  });
}

// ---- 切换先手 ----
function handleToggleFirst() {
  toggleFirst({
    onReset: function() {
      firstPlayer = parseInt(localStorage.getItem("ludo_first") || "1") || 1;
      resetGame();
    }
  });
}

// ---- 切换主题 ----
function handleToggleTheme() {
  if (gameState && gameState.isTurnBusy) { showToast('请先完成当前回合'); return; }
  toggleTheme(function() {
    if (gameState) {
      initBoard(gameState);
      initDice();
      if (gameState.diceValue) renderDice(gameState.diceValue);
    }
  });
}

// ---- 切换背景动画 ----
function handleToggleBgAnimation() {
  toggleBgAnimation();
}

// ---- 开始游戏 ----
function handleStartGame() {
  document.getElementById("homePage").style.display = "none";
  document.querySelector(".game-container").style.display = "";
  recordPlayDay();
  checkAchievements(null, gameStats).catch(function() {});
  if (!gameInitialized) {
    gameState = newGameState();
    initBoard(gameState);
    initDice();
    updateTurnDisplay();
    updateFirstBtn();
    updatePlayerDisplay();
    renderPhotos();
    gameInitialized = true;
  }
  if (gameState.pendingEvent) showEventTask(gameState.pendingEvent);
}

// ---- 返回首页 ----
function handleGoHome() {
  if (gameState && (gameState.isRolling || gameState.isAnimating)) {
    showToast('棋子移动完成后即可返回首页');
    return;
  }
  cleanupCelebration();
  var popup = document.querySelector(".popup-overlay");
  if (popup) popup.remove();
  document.querySelector(".game-container").style.display = "none";
  document.getElementById("homePage").style.display = "";
  renderHomePage(playerData, gameStats);
}

// ---- 保存玩家编辑 ----
function handleSavePlayerEditor() {
  var n1 = document.getElementById("p1Name").value.trim() || "鹿角虫";
  var i1 = document.getElementById("p1Icon").value.trim() || "🐺";
  var n2 = document.getElementById("p2Name").value.trim() || "小曦曦";
  var i2 = document.getElementById("p2Icon").value.trim() || "🐷";
  playerData = { 1: { name: n1, icon: i1 }, 2: { name: n2, icon: i2 } };
  savePlayers(playerData);
  updatePlayerDisplay();
  updateFirstBtn();
  renderHomePage(playerData, gameStats);
  if (gameState) {
    gameState.players[1].name = n1;
    gameState.players[1].icon = i1;
    gameState.players[2].name = n2;
    gameState.players[2].icon = i2;
    placePieces(gameState);
  }
  document.getElementById("playerEditorOverlay").classList.remove("show");
  showMessage("玩家信息已更新！");
  vibrate([30, 50, 30]);
}

// ---- 重置统计 ----
function handleResetStats() {
  if (!confirm("确定要重置所有统计数据吗？")) return;
  gameStats = { total: 0, p1Wins: 0, p2Wins: 0 };
  saveStats(gameStats);
  localStorage.removeItem("ludo_last_winner");
  localStorage.removeItem("ludo_win_streak");
  document.getElementById("statsContent").textContent = "";
  renderHomePage(playerData, gameStats);
  showMessage("统计数据已重置");
  vibrate([30, 50, 30]);
}

// ---- 保存纪念日 ----
function handleSaveAnniversary() {
  var val = document.getElementById("anniversaryInput").value;
  if (!val) {
    showToast("请选择一个日期");
    return;
  }
  var date = new Date(val + "T00:00:00");
  if (isNaN(date.getTime())) {
    showToast("日期格式不正确");
    return;
  }
  try {
    saveAnniversary(val);
  } catch (e) {
    showToast("保存失败，存储空间不足");
    return;
  }
  document.getElementById("anniversaryOverlay").classList.remove("show");
  renderHomePage(playerData, gameStats);
  showToast("纪念日已保存！💕");
  vibrate([30, 50, 30]);
  checkAchievements(null, gameStats).catch(function() {});
}

// ---- 照片编辑器代理 ----
function handleOpenPhotoEditor(playerId) { openPhotoEditor(playerId); }

// ---- 事件处理器映射 ----
function closeSettingsIfOpen() {
  var el = document.getElementById('settingsOverlay');
  if (el && el.classList.contains('show')) el.classList.remove('show');
}

var actionHandlers = {
  'startGame': function() { handleStartGame(); },
  'goHome': function() { handleGoHome(); },
  'rollDice': function() { rollDice(); },
  'resetGame': function() { resetGame(); },
  'openEditor': function() { closeSettingsIfOpen(); openEditor(); },
  'closeEditor': function() {
    document.getElementById('editorOverlay').classList.remove('show');
  },
  'saveEvents': function() { saveEvents(); },
  'resetEvents': function() { resetEvents(); },
  'openPlayerEditor': function() { closeSettingsIfOpen(); openPlayerEditor(); },
  'closePlayerEditor': function() {
    document.getElementById('playerEditorOverlay').classList.remove('show');
  },
  'savePlayerEditor': function() { handleSavePlayerEditor(); },
  'openStats': function() { closeSettingsIfOpen(); openStats(playerData, gameStats); },
  'closeStats': function() {
    document.getElementById('statsOverlay').classList.remove('show');
  },
  'resetStats': function() { handleResetStats(); },
  'openSettings': function() { openSettings(); },
  'closeSettings': function() {
    document.getElementById('settingsOverlay').classList.remove('show');
  },
  'openAnniversary': function() { closeSettingsIfOpen(); openAnniversary(); },
  'closeAnniversary': function() {
    document.getElementById('anniversaryOverlay').classList.remove('show');
  },
  'saveAnniversary': function() { handleSaveAnniversary(); },
  'toggleFirst': function() { handleToggleFirst(); },
  'toggleTheme': function() { closeSettingsIfOpen(); handleToggleTheme(); },
  'toggleBgAnimation': function() { handleToggleBgAnimation(); },
  'openPhoto1': function() { handleOpenPhotoEditor(1); },
  'openPhoto2': function() { handleOpenPhotoEditor(2); },
  'closePhotoEditor': function() {
    document.getElementById('photoEditorOverlay').classList.remove('show');
  },
  'savePhoto': function() { savePhoto(); },
  'clearPhoto': function() { clearPhoto(); },
  'showComingSoon': function(e, feature) { showComingSoon(feature); },
  'openAlbum': function() { closeSettingsIfOpen(); openAlbum(); },
  'closeAlbum': function() { closeAlbum(); },
  'deleteAlbumPhoto': function() { deleteAlbumPhoto(); },
  'editPhotoCaption': function() { editPhotoCaption(); },
  'closeViewer': function() {
    closeViewer();
  },
  'openMemoryPage': function() { closeSettingsIfOpen(); openMemoryPage(); },
  'closeMemory': function() { closeMemoryPage(); },
  'openMemoryEditor': function(e, param) {
    if (param) { editMemoryById(parseInt(param)); }
    else { openMemoryEditor(null); }
  },
  'closeMemoryEditor': function() {
    closeMemoryEditor();
  },
  'saveMemory': function() { saveMemoryFromEditor(); },
  'deleteMemory': function(e, param) {
    if (param) deleteMemoryItem(parseInt(param));
  },
  'editMemory': function(e, param) {
    if (param) editMemoryById(parseInt(param));
  },
  'openAchievementPage': function() { closeSettingsIfOpen(); openAchievementPage(); },
  'closeAchievement': function() { closeAchievementPage(); },
  'openBackup': function() { closeSettingsIfOpen(); openBackup(); },
  'closeBackup': function() { closeBackup(); },
  'exportBackup': function() { exportBackup(); },
  'restoreBackup': function() { restoreBackup(); },
  'applyUpdate': function() { applyAppUpdate(); },
};

// ---- 事件绑定 ----
function bindEventListeners() {
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    // 带关闭动作的遮罩层只响应对遮罩本身的点击，避免点击弹窗内容时误关闭。
    if (el.classList.contains('editor-overlay') && e.target !== el) return;
    var action = el.dataset.action;
    var param = el.dataset.param;
    if (actionHandlers[action]) {
      if (param) { actionHandlers[action](e, param); }
      else { actionHandlers[action](e); }
    }
  });

  var photoUrlInput = document.getElementById("photoUrlInput");
  if (photoUrlInput) photoUrlInput.addEventListener("input", updatePhotoPreview);

  var photoFileInput = document.getElementById("photoFileInput");
  if (photoFileInput) photoFileInput.addEventListener("change", function(e) {
    if (e.target.files[0]) handlePhotoFile(e.target.files[0]);
  });

  var albumFileInput = document.getElementById("albumFileInput");
  if (albumFileInput) albumFileInput.addEventListener("change", function(e) {
    if (e.target.files[0]) addAlbumPhoto(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('backupFileInput').addEventListener('change', function(e) {
    previewBackup(e.target.files[0]);
    e.target.value = '';
  });

  // 键盘快捷键
  document.addEventListener("keydown", function(e) {
    var homePage = document.getElementById("homePage");
    if (homePage && homePage.style.display !== "none") return;
    if (document.querySelector(".popup-overlay") || document.querySelector(".editor-overlay.show")) return;
    if (e.key === " " || e.key === "Space") {
      e.preventDefault();
      rollDice();
    }
    if ((e.key === "r" || e.key === "R") && (e.ctrlKey || e.metaKey)) return;
    if (e.key === "r" || e.key === "R") {
      if (gameState && !gameState.gameOver && !gameState.isTurnBusy) {
        resetGame();
      }
    }
  });
}

// ---- 启动 ----
initTheme();
initBgAnimation();
bindEventListeners();
renderHomePage(playerData, gameStats);
