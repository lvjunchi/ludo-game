// 完整本地备份；所有文件操作由用户主动触发。
var BACKUP_KEYS = [
  'ludo_players', 'ludo_stats', 'ludo_photos', 'ludo_anniversary',
  'ludo_events', 'ludo_event_preset', 'ludo_preset_names', 'ludo_theme',
  'ludo_first', 'ludo_bg_anim', 'ludo_achievements', 'ludo_play_days',
  'ludo_last_winner', 'ludo_win_streak'
];
var pendingBackup = null;
var backupBusy = false;
var backupReadGeneration = 0;

function applyBackupSettings(settings) {
  // 先释放旧配置占用，避免恢复或回滚时因临时同时占用两份空间而失败。
  BACKUP_KEYS.forEach(function(key) { localStorage.removeItem(key); });
  BACKUP_KEYS.forEach(function(key) {
    if (settings[key] != null) localStorage.setItem(key, settings[key]);
  });
}

async function collectBackup() {
  var records = await readBackupRecords();
  var settings = {};
  BACKUP_KEYS.forEach(function(key) { settings[key] = localStorage.getItem(key); });
  if (settings.ludo_events !== null) {
    var events = JSON.parse(settings.ludo_events);
    if (Array.isArray(events) && events.length === 57) settings.ludo_events = JSON.stringify(events.slice(0, TOTAL_CELLS));
  }
  return { app: 'couple-ludo', version: 1, exportedAt: new Date().toISOString(),
    settings: settings, photos: records.photos, memories: records.memories };
}

function validateBackup(value) {
  function requireValid(ok) { if (!ok) throw new Error('备份格式不正确，未修改现有数据'); }
  function object(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function text(v) { return typeof v === 'string'; }
  function count(v) { return Number.isSafeInteger(v) && v >= 0; }
  function date(v) {
    if (v === '') return true;
    if (!text(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var d = new Date(v + 'T00:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }
  function image(v) { return text(v) && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(v); }
  function avatar(v) { return v === '' || image(v) || (text(v) && /^https?:\/\//i.test(v)); }
  requireValid(object(value) && value.app === 'couple-ludo' && value.version === 1);
  requireValid(object(value.settings) && Array.isArray(value.photos) && Array.isArray(value.memories));
  requireValid(text(value.exportedAt) && !isNaN(Date.parse(value.exportedAt)));
  var validators = {
    ludo_players: function(v) { return object(v) && [1,2].every(function(i) { return object(v[i]) && text(v[i].name) && text(v[i].icon); }); },
    ludo_stats: function(v) { return object(v) && count(v.total) && count(v.p1Wins) && count(v.p2Wins) && v.total === v.p1Wins + v.p2Wins; },
    ludo_photos: function(v) { return object(v) && avatar(v[1]) && avatar(v[2]); },
    ludo_events: function(v) { return Array.isArray(v) && v.length === TOTAL_CELLS && v.every(text); },
    ludo_preset_names: function(v) { return object(v) && Object.keys(v).every(function(k) { return Object.hasOwn(EVENT_PRESETS, k) && text(v[k]); }); },
    ludo_achievements: function(v) { return object(v) && Array.isArray(v.unlocked) && v.unlocked.every(function(id) { return ACHIEVEMENTS.some(function(a) { return a.id === id; }); }); },
    ludo_play_days: function(v) { return Array.isArray(v) && v.every(function(d) { return d !== '' && date(d); }); }
  };
  var settings = {};
  BACKUP_KEYS.forEach(function(key) {
    var raw = value.settings[key];
    requireValid(Object.hasOwn(value.settings, key) && (raw === null || text(raw)));
    if (raw !== null) {
      if (validators[key]) {
        var parsed;
        try { parsed = JSON.parse(raw); } catch (e) { requireValid(false); }
        requireValid(validators[key](parsed));
      } else if (key === 'ludo_anniversary') requireValid(date(raw));
      else if (key === 'ludo_theme') requireValid(['light','dark','lumu'].includes(raw));
      else if (key === 'ludo_first') requireValid(['1','2'].includes(raw));
      else if (key === 'ludo_bg_anim') requireValid(['0','1'].includes(raw));
      else if (key === 'ludo_event_preset') requireValid(Object.hasOwn(EVENT_PRESETS, raw));
      else if (key === 'ludo_last_winner') requireValid(['0','1','2'].includes(raw));
      else if (key === 'ludo_win_streak') requireValid(/^\d+$/.test(raw) && count(Number(raw)));
    }
    settings[key] = raw;
  });
  function records(items, isPhoto) {
    var ids = new Set();
    return items.map(function(v) {
      requireValid(object(v) && Number.isSafeInteger(v.id) && v.id > 0 && !ids.has(v.id));
      ids.add(v.id);
      requireValid(Number.isFinite(v.createdAt) && v.createdAt >= 0 && date(v.date));
      if (isPhoto) {
        requireValid(image(v.data) && text(v.caption));
        return { id: v.id, data: v.data, caption: v.caption, date: v.date, createdAt: v.createdAt };
      }
      requireValid(text(v.title) && text(v.content));
      requireValid(v.photoId === null || (Number.isSafeInteger(v.photoId) && v.photoId > 0));
      return { id: v.id, title: v.title, content: v.content, date: v.date, photoId: v.photoId, createdAt: v.createdAt };
    });
  }
  var photos = records(value.photos, true);
  var memories = records(value.memories, false);
  requireValid(memories.every(function(m) { return m.photoId === null || photos.some(function(p) { return p.id === m.photoId; }); }));
  return { app: value.app, version: 1, exportedAt: value.exportedAt, settings: settings, photos: photos, memories: memories };
}

function mergeBackups(current, incoming) {
  var merged = JSON.parse(JSON.stringify(current));
  var nextPhoto = merged.photos.reduce(function(max, p) { return Math.max(max, p.id); }, 0) + 1;
  var nextMemory = merged.memories.reduce(function(max, m) { return Math.max(max, m.id); }, 0) + 1;
  var photoIds = {};
  incoming.photos.forEach(function(p) {
    var match = merged.photos.find(function(existing) { return existing.data === p.data && existing.caption === p.caption && existing.date === p.date; });
    if (!match) { match = Object.assign({}, p, { id: nextPhoto++ }); merged.photos.push(match); }
    photoIds[p.id] = match.id;
  });
  incoming.memories.forEach(function(m) {
    var photoId = m.photoId === null ? null : photoIds[m.photoId];
    if (!merged.memories.some(function(existing) { return existing.date === m.date && existing.title === m.title && existing.content === m.content && existing.photoId === photoId; })) {
      merged.memories.push(Object.assign({}, m, { id: nextMemory++, photoId: photoId }));
    }
  });
  BACKUP_KEYS.forEach(function(key) { if (merged.settings[key] === null) merged.settings[key] = incoming.settings[key]; });
  ['ludo_play_days', 'ludo_achievements'].forEach(function(key) {
    var a = JSON.parse(current.settings[key] || (key === 'ludo_play_days' ? '[]' : '{"unlocked":[]}'));
    var b = JSON.parse(incoming.settings[key] || (key === 'ludo_play_days' ? '[]' : '{"unlocked":[]}'));
    var union = Array.from(new Set(key === 'ludo_play_days' ? a.concat(b) : a.unlocked.concat(b.unlocked)));
    merged.settings[key] = JSON.stringify(key === 'ludo_play_days' ? union : { unlocked: union });
  });
  var a = JSON.parse(current.settings.ludo_stats || '{"total":0,"p1Wins":0,"p2Wins":0}');
  var b = JSON.parse(incoming.settings.ludo_stats || '{"total":0,"p1Wins":0,"p2Wins":0}');
  var stats = { p1Wins: Math.max(a.p1Wins, b.p1Wins), p2Wins: Math.max(a.p2Wins, b.p2Wins) };
  stats.total = stats.p1Wins + stats.p2Wins;
  merged.settings.ludo_stats = JSON.stringify(stats);
  // 连胜与最后赢家必须作为一组保留，不能分别取不同备份的值。
  if (current.settings.ludo_win_streak !== null) {
    merged.settings.ludo_win_streak = current.settings.ludo_win_streak;
    merged.settings.ludo_last_winner = current.settings.ludo_last_winner;
  }
  if (merged.settings.ludo_events !== null) merged.settings.ludo_event_preset = null;
  return merged;
}

function downloadBackup(backup, prefix) {
  var url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }));
  var link = document.createElement('a');
  link.href = url;
  link.download = (prefix || '情侣飞行棋备份') + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
}

function setBackupBusy(busy) {
  backupBusy = busy;
  document.querySelectorAll('#backupOverlay button, #backupOverlay input, #backupOverlay select').forEach(function(el) { el.disabled = busy; });
  if (!busy) document.getElementById('restoreBackupBtn').disabled = !pendingBackup;
}

function openBackup() {
  pendingBackup = null;
  backupReadGeneration++;
  document.getElementById('backupPreview').textContent = '选择备份文件后，可查看照片和回忆数量。';
  document.getElementById('backupLastTime').textContent = localStorage.getItem('ludo_last_backup') ? '最近导出：' + new Date(localStorage.getItem('ludo_last_backup')).toLocaleString() : '还没有导出过备份';
  setBackupBusy(false);
  document.getElementById('backupOverlay').classList.add('show');
}

function closeBackup() {
  if (backupBusy) return;
  backupReadGeneration++;
  pendingBackup = null;
  document.getElementById('backupOverlay').classList.remove('show');
}

async function exportBackup() {
  if (backupBusy) return;
  setBackupBusy(true);
  try {
    var backup = await collectBackup();
    downloadBackup(backup);
    localStorage.setItem('ludo_last_backup', backup.exportedAt);
    document.getElementById('backupLastTime').textContent = '最近导出：' + new Date(backup.exportedAt).toLocaleString();
    showToast('备份已生成，请保存下载的文件');
  } catch (e) { showToast('导出失败，请重试：' + e.message); }
  finally { setBackupBusy(false); }
}

async function previewBackup(file) {
  var generation = ++backupReadGeneration;
  pendingBackup = null;
  document.getElementById('restoreBackupBtn').disabled = true;
  if (!file) return;
  try {
    if (file.size > 100 * 1024 * 1024) throw new Error('备份文件不能超过 100MB');
    var backup = validateBackup(JSON.parse(await file.text()));
    if (generation !== backupReadGeneration) return;
    pendingBackup = backup;
    document.getElementById('backupPreview').textContent = '备份时间：' + new Date(backup.exportedAt).toLocaleString() + '\n照片：' + backup.photos.length + ' 张；回忆：' + backup.memories.length + ' 条';
    document.getElementById('restoreBackupBtn').disabled = false;
  } catch (e) {
    if (generation !== backupReadGeneration) return;
    document.getElementById('backupPreview').textContent = '无法读取此备份：' + e.message;
  }
}

async function restoreBackup() {
  if (!pendingBackup || backupBusy) return;
  var mode = document.getElementById('backupMode').value;
  if (!confirm(mode === 'replace' ? '覆盖会替换当前设置、统计、照片和回忆。建议先导出当前备份。确定恢复？' : '合并会保留当前设置，补充照片、回忆与成就，胜场取较高值。确定合并？')) return;
  setBackupBusy(true);
  try {
    var incoming = validateBackup(pendingBackup);
    var current = await collectBackup();
    var target = mode === 'merge' ? validateBackup(mergeBackups(current, incoming)) : incoming;
    achievementEpoch++;
    await writeBackupRecords(target, target.settings);
    refreshAfterRestore();
    pendingBackup = null;
    setBackupBusy(false);
    closeBackup();
    showToast('恢复成功，已回到首页');
  } catch (e) { showToast('恢复失败：' + e.message); }
  finally { setBackupBusy(false); }
}

function refreshAfterRestore() {
  currentGeneration++;
  stopDiceTicks();
  cleanupCelebration();
  document.querySelectorAll('.popup-overlay, .celebration, .consolation-cele, .consolation-msg, .piece.moving').forEach(function(el) { el.remove(); });
  playerData = loadPlayers();
  gameStats = loadStats();
  _photos = loadPhotos();
  firstPlayer = parseInt(localStorage.getItem('ludo_first') || '1');
  CELL_EVENTS = initCellEvents();
  gameState = null;
  gameInitialized = false;
  closeViewer();
  ['albumPage','memoryPage','achievementPage'].forEach(function(id) { document.getElementById(id).style.display = 'none'; });
  document.querySelector('.game-container').style.display = 'none';
  document.getElementById('homePage').style.display = '';
  initTheme();
  stopBgAnimation();
  initBgAnimation();
  renderHomePage(playerData, gameStats);
}
