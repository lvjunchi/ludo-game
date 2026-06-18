// 情侣飞行棋 - UI 工具

var bgAnimOn = false;

function showPopup(text, duration) {
  document.querySelector(".popup-overlay")?.remove();
  var overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  var box = document.createElement("div");
  box.className = "popup-box";
  box.textContent = text;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.addEventListener("click", function() { overlay.remove(); });
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, duration || 3000);
}

function showMessage(msg) {
  document.getElementById("gameMessage").textContent = msg;
}

function showToast(msg) {
  document.querySelectorAll(".home-toast").forEach(function(t) { t.remove(); });
  var toast = document.createElement("div");
  toast.className = "home-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 2000);
}

function closeOverlay(e, overlayId) {
  if (e && e.target !== document.getElementById(overlayId)) return;
  document.getElementById(overlayId).classList.remove("show");
}

function applyTheme(theme) {
  document.body.classList.remove("dark", "lumu");
  if (theme === "dark") document.body.classList.add("dark");
  else if (theme === "lumu") document.body.classList.add("lumu");
  localStorage.setItem("ludo_theme", theme);
  updateThemeBtn();
}

function updateThemeBtn() {
  var theme = localStorage.getItem("ludo_theme") || "light";
  var btn = document.getElementById("themeBtn");
  if (theme === "light") btn.textContent = "☀️ 浅色";
  else if (theme === "dark") btn.textContent = "🌙 深色";
  else if (theme === "lumu") btn.innerHTML = '<span class="heart-gradient">♥</span> 橹穆';
  var settingsBtn = document.getElementById("settingsThemeBtn");
  if (settingsBtn) {
    if (theme === "light") settingsBtn.textContent = "☀️ 浅色";
    else if (theme === "dark") settingsBtn.textContent = "🌙 深色";
    else settingsBtn.innerHTML = '<span class="heart-gradient">♥</span> 橹穆';
  }
}

function initTheme() {
  var oldDark = localStorage.getItem("ludo_dark");
  var theme = localStorage.getItem("ludo_theme");
  if (!theme && oldDark !== null) {
    theme = oldDark === "1" ? "dark" : "light";
    localStorage.setItem("ludo_theme", theme);
    localStorage.removeItem("ludo_dark");
  }
  applyTheme(theme || "light");
}

function toggleTheme(onThemeChange) {
  var theme = localStorage.getItem("ludo_theme") || "light";
  var next = theme === "light" ? "dark" : theme === "dark" ? "lumu" : "light";
  applyTheme(next);
  if (onThemeChange) onThemeChange();
  vibrate(30);
}

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

function showComingSoon(feature) {
  showToast(feature + " 即将推出，敬请期待 💕");
  vibrate(20);
}

// ---- 内部函数 ----

function updateBgBtn() {
  document.getElementById("bgBtn").textContent = bgAnimOn ? "💗 背景" : "🤍 背景";
  var settingsBtn = document.getElementById("settingsBgBtn");
  if (settingsBtn) settingsBtn.textContent = bgAnimOn ? "💗 开启" : "🤍 关闭";
}

function startBgAnimation() {
  bgAnimOn = true;
  var container = document.getElementById("bgAnimation");
  container.innerHTML = "";
  container.classList.add("active");
  var symbols = ["❤️", "💕", "💗", "🌸", "🌺", "💖", "🩷"];
  for (var i = 0; i < 22; i++) {
    var el = document.createElement("div");
    el.className = "float-element";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + "%";
    el.style.animationDelay = Math.random() * 12 + "s";
    el.style.animationDuration = (12 + Math.random() * 10) + "s";
    el.style.fontSize = (14 + Math.random() * 18) + "px";
    var opacity = 0.12 + Math.random() * 0.2;
    el.style.setProperty("--float-opacity", opacity);
    el.style.opacity = opacity;
    container.appendChild(el);
  }
}

function stopBgAnimation() {
  bgAnimOn = false;
  document.getElementById("bgAnimation").classList.remove("active");
}
