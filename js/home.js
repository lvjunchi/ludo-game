// 情侣飞行棋 - 首页与编辑器

// ============ 情话与文案 ============

var LOVE_QUOTES = [
  "感谢你出现在我的生命里",
  "今天也要比昨天更喜欢你一点",
  "最浪漫的事，是和同一个人玩很多很多次飞行棋",
  "你是我最好的意外",
  "有你的地方就是家",
  "想和你一起慢慢变老",
  "你笑起来真好看",
  "余生请多指教",
  "你是我的小幸运",
  "遇见你是最美丽的意外",
  "和你在一起的每一天都是情人节",
  "你是我写不完的情书",
  "世界很大，幸福很小，有你就好",
  "你是我所有的少女情怀和心之所向",
  "今天的风很甜，因为想起了你",
  "你是我藏在心底的秘密",
  "想牵你的手，从心动到白头",
  "你是我这辈子最想留住的幸运",
  "喜欢你是一件很幸福的事",
  "你是我所有温柔的来源",
  "愿往后余生，冷暖有相知",
  "你是我漫长人生里斩钉截铁的梦想",
  "世间五味俱全，谢谢你给我的甜",
  "你是我意料之外的意外",
  "我见过春风十里，见过夏至未至，全都不及此刻遇见你",
  "你是我温暖的手套，冰冷的啤酒",
  "想把世界上最好的都给你",
  "你是我的今天，也是我所有的明天",
  "你是我生命中的一束光",
  "我愿意用一辈子的桃花运换一个对的人",
  "你是我最想留住的幸运",
  "春风十里不如你",
  "我想和你一起闯进森林潜入海底",
  "你是年少的欢喜",
];

var FOOTER_PHRASES = [
  "❤️ 今天也要喜欢你 ❤️",
  "💕 和你在一起的每一天都值得纪念",
  "🌹 你是我最甜蜜的日常",
  "✨ 有你就是最好的时光",
  "💗 喜欢你是我做过最对的事",
  "🥰 你是我生命中的小确幸",
  "💑 一起走过的路都是风景",
];

// ============ 模块内部状态 ============

var _currentPhotoPlayer = null;
var _photos = loadPhotos();
var _currentViewingPhoto = null;
var _editingMemoryId = null;

// ============ 辅助函数 ============

function calcDaysTogether() {
  var ann = loadAnniversary();
  if (!ann) return null;
  var date = new Date(ann + "T00:00:00");
  if (isNaN(date.getTime())) return null;
  var diff = Date.now() - date.getTime();
  if (diff < 0) return -1;
  return Math.floor(diff / 86400000) + 1;
}

function getCoupleLevel(total) {
  if (total >= 100) return { lv: 6, name: "永恒", emoji: "💍", next: null };
  if (total >= 51)  return { lv: 5, name: "深爱", emoji: "💖", next: 100 };
  if (total >= 31)  return { lv: 4, name: "甜蜜", emoji: "🍬", next: 51 };
  if (total >= 16)  return { lv: 3, name: "热恋", emoji: "🔥", next: 31 };
  if (total >= 6)   return { lv: 2, name: "心动", emoji: "💓", next: 16 };
  return { lv: 1, name: "初识", emoji: "🌱", next: 6 };
}

function getDailyQuote() {
  var today = new Date();
  var dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % LOVE_QUOTES.length;
  return LOVE_QUOTES[dayIndex];
}

function renderStats(playerData, gameStats) {
  var p1 = playerData[1];
  var p2 = playerData[2];
  var container = document.getElementById("statsContent");
  container.textContent = "";
  var rows = [
    { label: "总对局", value: gameStats.total },
    { label: escapeHtml(p1.icon) + " " + escapeHtml(p1.name) + " 胜利", value: gameStats.p1Wins },
    { label: escapeHtml(p2.icon) + " " + escapeHtml(p2.name) + " 胜利", value: gameStats.p2Wins },
  ];
  rows.forEach(function(r) {
    var row = document.createElement("div");
    row.className = "stat-row";
    var label = document.createElement("span");
    label.className = "stat-label";
    label.innerHTML = r.label;
    var value = document.createElement("span");
    value.className = "stat-value";
    value.textContent = r.value;
    row.appendChild(label);
    row.appendChild(value);
    container.appendChild(row);
  });
}

// ============ 首页渲染 ============

function renderHomePage(playerData, gameStats) {

  // 头像
  forEach([1, 2], function(pid) {
    var avatar = document.getElementById("homeAvatar" + pid);
    avatar.textContent = "";
    var url = _photos[pid];
    if (url) {
      var img = document.createElement("img");
      img.alt = playerData[pid].name;
      img.onerror = function() { img.remove(); avatar.textContent = playerData[pid].icon; };
      img.src = url;
      avatar.appendChild(img);
    } else {
      avatar.textContent = playerData[pid].icon;
    }
  });

  // 名字
  var names = document.getElementById("homeNames");
  names.textContent = playerData[1].icon + " " + playerData[1].name + " ❤️ " + playerData[2].icon + " " + playerData[2].name;

  // 天数
  var days = calcDaysTogether();
  var daysEl = document.getElementById("homeDays");
  if (days === -1) {
    daysEl.textContent = "📅 纪念日尚未到来，敬请期待";
  } else if (days) {
    daysEl.textContent = "已经相伴 " + days + " 天";
  } else {
    daysEl.textContent = "💕 点击设置纪念日";
  }

  // 今日情话
  document.getElementById("homeQuote").textContent = getDailyQuote();

  // 统计
  var level = getCoupleLevel(gameStats.total);
  var statsEl = document.getElementById("homeStats");
  var levelProgress = "";
  if (level.next) {
    var prevThreshold = [0, 0, 6, 16, 31, 51, 100][level.lv];
    var pct = Math.min(100, ((gameStats.total - prevThreshold) / (level.next - prevThreshold)) * 100);
    levelProgress = '<div class="home-level-bar"><div class="home-level-fill" style="width:' + pct + '%"></div></div>';
  }
  statsEl.innerHTML = '<div class="home-stats-grid">'
    + '<div class="home-stat-item"><span class="home-stat-value">' + gameStats.total + '</span><span class="home-stat-label">总对局</span></div>'
    + '<div class="home-stat-item"><span class="home-stat-value">' + gameStats.p1Wins + ' / ' + gameStats.p2Wins + '</span><span class="home-stat-label">' + escapeHtml(playerData[1].name) + ' / ' + escapeHtml(playerData[2].name) + ' 胜</span></div>'
    + '<div class="home-level"><span>' + level.emoji + ' 情侣等级：Lv' + level.lv + ' ' + level.name + '</span>' + levelProgress + '</div>'
    + '</div>';

  // 底部文案
  var footerIndex = (new Date().getDate()) % FOOTER_PHRASES.length;
  document.getElementById("homeFooter").textContent = FOOTER_PHRASES[footerIndex];
}

// ============ 照片编辑器 ============

function openPhotoEditor(playerId) {
  _currentPhotoPlayer = playerId;
  var title = document.getElementById("photoEditorTitle");
  title.textContent = "设置" + (playerData[playerId]?.name || "玩家" + playerId) + "的照片";
  var input = document.getElementById("photoUrlInput");
  input.value = _photos[playerId] || "";
  updatePhotoPreview();
  document.getElementById("photoEditorOverlay").classList.add("show");
  vibrate(20);
}

function updatePhotoPreview() {
  var preview = document.getElementById("photoPreview");
  var url = document.getElementById("photoUrlInput").value.trim();
  preview.textContent = "";
  if (url) {
    var img = document.createElement("img");
    img.onerror = function() { preview.textContent = "加载失败"; };
    img.src = url;
    preview.appendChild(img);
  } else {
    preview.textContent = _currentPhotoPlayer === 1 ? "🐺" : "🐷";
  }
}

function savePhoto() {
  var url = document.getElementById("photoUrlInput").value.trim();
  _photos[_currentPhotoPlayer] = url;
  localStorage.setItem("ludo_photos", JSON.stringify(_photos));
  renderPhotos();
  document.getElementById("photoEditorOverlay").classList.remove("show");
  showMessage("照片已保存！");
  vibrate([30, 50, 30]);
}

function clearPhoto() {
  _photos[_currentPhotoPlayer] = "";
  localStorage.setItem("ludo_photos", JSON.stringify(_photos));
  renderPhotos();
  document.getElementById("photoEditorOverlay").classList.remove("show");
  showMessage("照片已清除");
  vibrate(30);
}

function handlePhotoFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  var reader = new FileReader();
  reader.onerror = function() { showMessage("图片读取失败"); };
  reader.onload = function(e) {
    var img = new Image();
    img.onerror = function() { showMessage("图片加载失败，可能格式不支持"); };
    img.onload = function() {
      var w = img.width, h = img.height;
      if (w > PHOTO_MAX_SIZE || h > PHOTO_MAX_SIZE) {
        if (w > h) { h = Math.round(h * PHOTO_MAX_SIZE / w); w = PHOTO_MAX_SIZE; }
        else { w = Math.round(w * PHOTO_MAX_SIZE / h); h = PHOTO_MAX_SIZE; }
      }
      var canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      var dataUrl = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
      try {
        _photos[_currentPhotoPlayer] = dataUrl;
        localStorage.setItem("ludo_photos", JSON.stringify(_photos));
      } catch (e) {
        showMessage("照片太大，存储空间不足，请换一张较小的图片");
        return;
      }
      renderPhotos();
      document.getElementById("photoEditorOverlay").classList.remove("show");
      showMessage("照片已保存！");
      vibrate([30, 50, 30]);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function renderPhotos() {
  forEach([1, 2], function(pid) {
    var card = document.getElementById("photo" + pid);
    var url = _photos[pid];
    var p = playerData[pid];
    card.textContent = "";

    var label = document.createElement("span");
    label.className = "photo-label";
    label.textContent = p.name;

    if (url) {
      var img = document.createElement("img");
      img.alt = escapeHtml(p.name);
      img.onerror = function() {
        img.style.display = "none";
        var err = document.createElement("div");
        err.className = "photo-placeholder";
        err.textContent = "❌";
        card.insertBefore(err, label);
      };
      img.src = url;
      card.appendChild(img);
    } else {
      var placeholder = document.createElement("div");
      placeholder.className = "photo-placeholder";
      placeholder.textContent = p.icon;
      card.appendChild(placeholder);
    }
    card.appendChild(label);
  });
}

// ============ 玩家编辑器 ============

function openPlayerEditor() {
  document.getElementById("p1Name").value = playerData[1].name;
  document.getElementById("p1Icon").value = playerData[1].icon;
  document.getElementById("p2Name").value = playerData[2].name;
  document.getElementById("p2Icon").value = playerData[2].icon;
  document.getElementById("playerEditorOverlay").classList.add("show");
  vibrate(20);
}

// ============ 游戏统计 ============

function openStats(playerData, gameStats) {
  renderStats(playerData, gameStats);
  document.getElementById("statsOverlay").classList.add("show");
  vibrate(20);
}

// ============ 先手选择 ============

function updateFirstBtn() {
  var btn = document.getElementById("firstBtn");
  var icon = playerData[firstPlayer]?.icon || "🐺";
  btn.textContent = "先手: " + icon;
}

function toggleFirst(callbacks) {
  firstPlayer = firstPlayer === 1 ? 2 : 1;
  localStorage.setItem("ludo_first", String(firstPlayer));
  updateFirstBtn();
  if (callbacks.onReset) callbacks.onReset();
}

// ============ 设置 ============

function openSettings() {
  document.getElementById("settingsOverlay").classList.add("show");
  vibrate(20);
}

// ============ 纪念日 ============

function openAnniversary() {
  var input = document.getElementById("anniversaryInput");
  input.value = loadAnniversary();
  document.getElementById("anniversaryOverlay").classList.add("show");
  vibrate(20);
}

// ============ 相册 ============

async function openAlbum() {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("albumPage").style.display = "";
  try {
    await renderAlbumGrid();
  } catch (e) {
    document.getElementById("albumGrid").innerHTML = '<div class="album-empty">😵 加载相册失败，请重试</div>';
  }
  vibrate(20);
}

function closeAlbum() {
  document.getElementById("albumPage").style.display = "none";
  document.getElementById("homePage").style.display = "";
}

async function renderAlbumGrid() {
  var grid = document.getElementById("albumGrid");
  grid.innerHTML = "";
  var photos = await getAllPhotos();
  if (photos.length === 0) {
    grid.innerHTML = '<div class="album-empty">📷 还没有照片，点击右上角添加吧</div>';
    return;
  }
  photos.forEach(function(photo) {
    var item = document.createElement("div");
    item.className = "album-item";
    item.dataset.id = photo.id;

    var img = document.createElement("img");
    img.alt = photo.caption || "";
    img.loading = "lazy";
    img.onerror = function() { item.style.display = "none"; };
    img.src = photo.data;
    item.appendChild(img);

    if (photo.date) {
      var dateEl = document.createElement("div");
      dateEl.className = "album-item-date";
      dateEl.textContent = photo.date;
      item.appendChild(dateEl);
    }

    item.addEventListener("click", function() { openViewer(photo); });
    grid.appendChild(item);
  });
}

function openViewer(photo) {
  _currentViewingPhoto = photo;
  var viewer = document.getElementById("photoViewer");
  var img = document.getElementById("viewerImage");
  var caption = document.getElementById("viewerCaption");
  img.src = photo.data;
  caption.textContent = photo.caption || "点击编辑添加描述";
  viewer.style.display = "flex";
  vibrate(15);
}

function closeViewer() {
  document.getElementById("photoViewer").style.display = "none";
  _currentViewingPhoto = null;
}

async function addAlbumPhoto(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("请选择图片文件");
    return;
  }
  showToast("正在处理图片...");

  var reader = new FileReader();
  reader.onerror = function() { showToast("图片读取失败"); };
  reader.onload = function(e) {
    var img = new Image();
    img.onerror = function() { showToast("图片加载失败"); };
    img.onload = async function() {
      var w = img.width, h = img.height;
      if (w > PHOTO_MAX_SIZE || h > PHOTO_MAX_SIZE) {
        if (w > h) { h = Math.round(h * PHOTO_MAX_SIZE / w); w = PHOTO_MAX_SIZE; }
        else { w = Math.round(w * PHOTO_MAX_SIZE / h); h = PHOTO_MAX_SIZE; }
      }
      var canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      var dataUrl = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);

      try {
        var today = new Date();
        var dateStr = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,'0') + "-" + String(today.getDate()).padStart(2,'0');
        await addPhoto({ data: dataUrl, caption: '', date: dateStr });
        await renderAlbumGrid();
        showToast("照片已添加 📸");
        vibrate([30, 50, 30]);
      } catch (err) {
        showToast("保存失败，请检查存储空间");
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function deleteAlbumPhoto() {
  if (!_currentViewingPhoto) return;
  if (!confirm("确定要删除这张照片吗？")) return;
  try {
    await deletePhoto(_currentViewingPhoto.id);
    closeViewer();
    await renderAlbumGrid();
    showToast("照片已删除");
    vibrate(30);
  } catch (err) {
    showToast("删除失败");
  }
}

async function editPhotoCaption() {
  if (!_currentViewingPhoto) return;
  var newCaption = prompt("输入照片描述：", _currentViewingPhoto.caption || "");
  if (newCaption === null) return;
  try {
    await updatePhoto(_currentViewingPhoto.id, { caption: newCaption });
    _currentViewingPhoto.caption = newCaption;
    document.getElementById("viewerCaption").textContent = newCaption || "点击编辑添加描述";
    await renderAlbumGrid();
    showToast("描述已更新");
    vibrate(20);
  } catch (err) {
    showToast("更新失败");
  }
}

// ============ 回忆墙 ============

function openMemoryPage() {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("memoryPage").style.display = "";
  renderMemoryTimeline().catch(function() {
    document.getElementById("memoryTimeline").innerHTML = '<div class="memory-empty">😵 加载回忆失败，请重试</div>';
  });
  vibrate(20);
}

function closeMemoryPage() {
  document.getElementById("memoryPage").style.display = "none";
  document.getElementById("homePage").style.display = "";
}

async function renderMemoryTimeline() {
  var container = document.getElementById("memoryTimeline");
  container.innerHTML = "";
  var memories = await getAllMemories();
  if (memories.length === 0) {
    container.innerHTML = '<div class="memory-empty">📖 还没有回忆，点击右上角新建吧</div>';
    return;
  }
  // 按日期分组
  var groups = {};
  memories.forEach(function(m) {
    var key = m.date || "未标注日期";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  // 渲染每个日期组
  Object.keys(groups).sort(function(a, b) { return b.localeCompare(a); }).forEach(function(date) {
    var group = document.createElement("div");
    group.className = "memory-date-group";
    var label = document.createElement("div");
    label.className = "memory-date-label";
    label.textContent = date;
    group.appendChild(label);
    groups[date].forEach(function(memory) {
      var item = document.createElement("div");
      item.className = "memory-item";
      item.innerHTML = '<div class="memory-item-title">' + escapeHtml(memory.title || "无标题") + '</div>'
        + '<div class="memory-item-content">' + escapeHtml(memory.content || "") + '</div>'
        + '<div class="memory-item-actions">'
        + '<button data-action="editMemory" data-param="' + memory.id + '">✏️ 编辑</button>'
        + '<button data-action="deleteMemory" data-param="' + memory.id + '">🗑️ 删除</button></div>';
      group.appendChild(item);
    });
    container.appendChild(group);
  });
}

function openMemoryEditor(memory) {
  _editingMemoryId = memory ? memory.id : null;
  document.getElementById("memoryEditorTitle").textContent = memory ? "编辑回忆" : "新建回忆";
  document.getElementById("memoryDate").value = memory ? memory.date || "" : "";
  document.getElementById("memoryTitle").value = memory ? memory.title || "" : "";
  document.getElementById("memoryContent").value = memory ? memory.content || "" : "";
  document.getElementById("memoryEditorOverlay").classList.add("show");
  vibrate(20);
}

function closeMemoryEditor() {
  document.getElementById("memoryEditorOverlay").classList.remove("show");
  _editingMemoryId = null;
}

async function saveMemoryFromEditor() {
  var date = document.getElementById("memoryDate").value;
  var title = document.getElementById("memoryTitle").value.trim();
  var content = document.getElementById("memoryContent").value.trim();
  if (!title && !content) {
    showToast("请输入标题或内容");
    return;
  }
  try {
    if (_editingMemoryId) {
      await updateMemory(_editingMemoryId, { date: date, title: title, content: content });
    } else {
      await addMemory({ date: date, title: title, content: content });
    }
    closeMemoryEditor();
    await renderMemoryTimeline();
    showToast(_editingMemoryId ? "回忆已更新 📝" : "回忆已保存 💕");
    vibrate([30, 50, 30]);
  } catch (err) {
    showToast("保存失败");
  }
}

async function deleteMemoryItem(id) {
  if (!confirm("确定要删除这条回忆吗？")) return;
  try {
    await deleteMemory(id);
    await renderMemoryTimeline();
    showToast("回忆已删除");
    vibrate(30);
  } catch (err) {
    showToast("删除失败");
  }
}

async function editMemoryById(id) {
  var memories = await getAllMemories();
  var memory = null;
  for (var mi = 0; mi < memories.length; mi++) {
    if (memories[mi].id === id) { memory = memories[mi]; break; }
  }
  if (memory) openMemoryEditor(memory);
}

// ============ 成就中心 ============

var ACHIEVEMENTS = [
  { id: "first_win", icon: "🏆", name: "初战告捷", desc: "赢得第一局游戏" },
  { id: "five_games", icon: "🎮", name: "甜蜜五局", desc: "累计完成5局游戏" },
  { id: "ten_win_streak", icon: "🔥", name: "十连胜", desc: "连续赢得10局游戏" },
  { id: "love_month", icon: "💕", name: "恋爱满月", desc: "恋爱天数达到30天" },
  { id: "hundred_games", icon: "🎯", name: "百局大师", desc: "累计完成100局游戏" },
  { id: "dominant_player", icon: "👑", name: "常胜将军", desc: "单方累计赢得50局" },
  { id: "set_anniversary", icon: "💝", name: "一见钟情", desc: "设置纪念日" },
  { id: "memory_collector", icon: "📖", name: "回忆收藏家", desc: "创建5条回忆" },
  { id: "photo_master", icon: "📸", name: "照片达人", desc: "添加10张照片到相册" },
  { id: "seven_days", icon: "📅", name: "全勤奖", desc: "连续7天游玩" },
];

async function checkAchievements(winnerId, gameStats) {
  var data = loadAchievements();
  var newlyUnlocked = [];
  var alreadyUnlocked = new Set(data.unlocked);

  // 1. 初战告捷
  if (gameStats.p1Wins + gameStats.p2Wins >= 1 && !alreadyUnlocked.has("first_win")) {
    newlyUnlocked.push("first_win");
  }

  // 2. 甜蜜五局
  if (gameStats.total >= 5 && !alreadyUnlocked.has("five_games")) {
    newlyUnlocked.push("five_games");
  }

  // 3. 十连胜
  var lastWinner = parseInt(localStorage.getItem("ludo_last_winner") || "0");
  var streak = parseInt(localStorage.getItem("ludo_win_streak") || "0");
  if (winnerId === lastWinner) {
    streak++;
  } else {
    streak = 1;
    localStorage.setItem("ludo_last_winner", String(winnerId));
  }
  localStorage.setItem("ludo_win_streak", String(streak));
  if (streak >= 10 && !alreadyUnlocked.has("ten_win_streak")) {
    newlyUnlocked.push("ten_win_streak");
  }

  // 4. 恋爱满月
  var ann = loadAnniversary();
  if (ann) {
    var annDate = new Date(ann + "T00:00:00");
    var days = Math.floor((Date.now() - annDate.getTime()) / 86400000) + 1;
    if (days >= 30 && !alreadyUnlocked.has("love_month")) {
      newlyUnlocked.push("love_month");
    }
  }

  // 5. 百局大师
  if (gameStats.total >= 100 && !alreadyUnlocked.has("hundred_games")) {
    newlyUnlocked.push("hundred_games");
  }

  // 6. 常胜将军
  if ((gameStats.p1Wins >= 50 || gameStats.p2Wins >= 50) && !alreadyUnlocked.has("dominant_player")) {
    newlyUnlocked.push("dominant_player");
  }

  // 7. 一见钟情
  if (ann && !alreadyUnlocked.has("set_anniversary")) {
    newlyUnlocked.push("set_anniversary");
  }

  // 8. 回忆收藏家
  try {
    var memories = await getAllMemories();
    if (memories.length >= 5 && !alreadyUnlocked.has("memory_collector")) {
      newlyUnlocked.push("memory_collector");
    }
  } catch (e) {}

  // 9. 照片达人
  try {
    var photosList = await getAllPhotos();
    if (photosList.length >= 10 && !alreadyUnlocked.has("photo_master")) {
      newlyUnlocked.push("photo_master");
    }
  } catch (e) {}

  // 10. 全勤奖
  var today = new Date();
  var todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  var playDays = loadPlayDays();
  if (playDays.indexOf(todayStr) === -1) {
    playDays.push(todayStr);
  }
  var cutoff = new Date(today.getTime() - 30 * 86400000);
  playDays = playDays.filter(function(d) { return new Date(d + "T00:00:00") >= cutoff; });
  savePlayDays(playDays);
  var consecutiveDays = 0;
  for (var ci = 0; ci < 7; ci++) {
    var checkDate = new Date(today.getTime() - ci * 86400000);
    var checkStr = checkDate.getFullYear() + "-" + String(checkDate.getMonth() + 1).padStart(2, "0") + "-" + String(checkDate.getDate()).padStart(2, "0");
    if (playDays.indexOf(checkStr) !== -1) {
      consecutiveDays++;
    } else {
      break;
    }
  }
  if (consecutiveDays >= 7 && !alreadyUnlocked.has("seven_days")) {
    newlyUnlocked.push("seven_days");
  }

  if (newlyUnlocked.length > 0) {
    data.unlocked.push.apply(data.unlocked, newlyUnlocked);
    saveAchievements(data);
    for (var ai = 0; ai < newlyUnlocked.length; ai++) {
      if (ai > 0) await new Promise(function(r) { setTimeout(r, 2500); });
      showAchievementUnlock(newlyUnlocked[ai]);
    }
  }

  return newlyUnlocked;
}

function showAchievementUnlock(achievementId) {
  var achievement = null;
  for (var ai = 0; ai < ACHIEVEMENTS.length; ai++) {
    if (ACHIEVEMENTS[ai].id === achievementId) { achievement = ACHIEVEMENTS[ai]; break; }
  }
  if (!achievement) return;

  var toast = document.getElementById("achievementUnlockToast");
  var nameEl = document.getElementById("achievementUnlockName");
  nameEl.textContent = achievement.icon + " " + achievement.name;
  toast.classList.add("show");
  vibrate([50, 30, 50]);

  setTimeout(function() { toast.classList.remove("show"); }, 2200);
}

function openAchievementPage() {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("achievementPage").style.display = "";
  renderAchievementGrid();
  vibrate(20);
}

function closeAchievementPage() {
  document.getElementById("achievementPage").style.display = "none";
  document.getElementById("homePage").style.display = "";
}

function renderAchievementGrid() {
  var grid = document.getElementById("achievementGrid");
  var progress = document.getElementById("achievementProgress");
  var data = loadAchievements();
  var unlockedSet = new Set(data.unlocked);

  progress.textContent = data.unlocked.length + " / " + ACHIEVEMENTS.length;
  grid.innerHTML = "";

  ACHIEVEMENTS.forEach(function(a) {
    var isUnlocked = unlockedSet.has(a.id);
    var card = document.createElement("div");
    card.className = "achievement-card " + (isUnlocked ? "unlocked" : "locked");
    card.innerHTML = '<div class="achievement-card-icon">' + a.icon + '</div>'
      + '<div class="achievement-card-name">' + a.name + '</div>'
      + '<div class="achievement-card-desc">' + a.desc + '</div>'
      + (isUnlocked ? '<div class="achievement-card-check">✓</div>' : "");
    grid.appendChild(card);
  });
}


