// 情侣飞行棋 - localStorage 封装

var DEFAULT_PLAYERS = {
  1: { name: "鹿角虫", icon: "🐺" },
  2: { name: "小曦曦", icon: "🐷" },
};

function loadSavedEvents() {
  try {
    var saved = localStorage.getItem("ludo_events");
    if (saved) {
      var arr = JSON.parse(saved);
      if (arr.length === 56) return arr;
    }
  } catch (e) {}
  return null;
}

function loadPlayers() {
  try {
    var saved = localStorage.getItem("ludo_players");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
}

function savePlayers(data) {
  localStorage.setItem("ludo_players", JSON.stringify(data));
}

function loadStats() {
  try {
    var saved = localStorage.getItem("ludo_stats");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { total: 0, p1Wins: 0, p2Wins: 0 };
}

function saveStats(data) {
  localStorage.setItem("ludo_stats", JSON.stringify(data));
}

function loadPhotos() {
  try {
    var saved = localStorage.getItem("ludo_photos");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { 1: "", 2: "" };
}

function loadAnniversary() {
  return localStorage.getItem("ludo_anniversary") || "";
}

function saveAnniversary(date) {
  localStorage.setItem("ludo_anniversary", date);
}

function loadPresetNames() {
  try {
    return JSON.parse(localStorage.getItem("ludo_preset_names")) || {};
  } catch (e) {}
  return {};
}

function savePresetNames(names) {
  localStorage.setItem("ludo_preset_names", JSON.stringify(names));
}

function loadAchievements() {
  try {
    var saved = localStorage.getItem("ludo_achievements");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { unlocked: [] };
}

function saveAchievements(data) {
  localStorage.setItem("ludo_achievements", JSON.stringify(data));
}

function loadPlayDays() {
  try {
    var saved = localStorage.getItem("ludo_play_days");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

function savePlayDays(arr) {
  localStorage.setItem("ludo_play_days", JSON.stringify(arr));
}

function getCurrentPreset() {
  return localStorage.getItem("ludo_event_preset") || null;
}

function setCurrentPreset(name) {
  if (name) localStorage.setItem("ludo_event_preset", name);
  else localStorage.removeItem("ludo_event_preset");
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
