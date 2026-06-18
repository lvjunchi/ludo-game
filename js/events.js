// 情侣飞行棋 - 格子事件与预设

var DEFAULT_EVENTS = [
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

var FUNNY_EVENTS = [
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

var ADVENTURE_EVENTS = [
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

var EVENT_PRESETS = {
  romantic: { name: "💕 浪漫版", events: DEFAULT_EVENTS },
  funny:    { name: "😂 搞笑版", events: FUNNY_EVENTS },
  adventure: { name: "🔥 冒险版", events: ADVENTURE_EVENTS },
};

function initCellEvents() {
  var saved = loadSavedEvents();
  if (saved) {
    setCurrentPreset(null);
    return saved;
  }
  var preset = getCurrentPreset();
  if (preset && EVENT_PRESETS[preset]) {
    return EVENT_PRESETS[preset].events.slice();
  }
  return DEFAULT_EVENTS.slice();
}

var CELL_EVENTS = initCellEvents();

// ============ 编辑器 ============

function openEditor() {
  var list = document.getElementById("editorList");
  list.innerHTML = "";
  CELL_EVENTS.forEach(function(text, i) {
    var item = document.createElement("div");
    item.className = "editor-item";
    var label = document.createElement("label");
    label.textContent = i;
    var input = document.createElement("input");
    input.type = "text";
    input.value = text;
    input.dataset.index = i;
    item.appendChild(label);
    item.appendChild(input);
    list.appendChild(item);
  });
  renderPresetBar();
  document.getElementById("editorOverlay").classList.add("show");
  vibrate(20);
}

function saveEvents() {
  var inputs = document.querySelectorAll("#editorList input");
  inputs.forEach(function(input) {
    var i = parseInt(input.dataset.index);
    CELL_EVENTS[i] = input.value || DEFAULT_EVENTS[i];
  });
  localStorage.setItem("ludo_events", JSON.stringify(CELL_EVENTS));
  setCurrentPreset(null);
  document.getElementById("editorOverlay").classList.remove("show");
  showMessage("事件已保存！");
  vibrate([30, 50, 30]);
}

function resetEvents() {
  CELL_EVENTS = DEFAULT_EVENTS.slice();
  localStorage.setItem("ludo_events", JSON.stringify(CELL_EVENTS));
  setCurrentPreset(null);
  openEditor();
  showMessage("已恢复默认事件");
  vibrate(30);
}

function applyPreset(name) {
  if (!EVENT_PRESETS[name]) return;
  CELL_EVENTS = EVENT_PRESETS[name].events.slice();
  localStorage.removeItem("ludo_events");
  setCurrentPreset(name);
  openEditor();
  showMessage("已切换到当前预设");
  vibrate([30, 50, 30]);
}

function renderPresetBar() {
  var bar = document.getElementById("presetBar");
  if (!bar) return;
  bar.innerHTML = "";
  var customNames = loadPresetNames();
  var current = getCurrentPreset();
  Object.keys(EVENT_PRESETS).forEach(function(key) {
    var preset = EVENT_PRESETS[key];
    var displayName = customNames[key] || preset.name;
    var wrap = document.createElement("div");
    wrap.className = "preset-item";
    var btn = document.createElement("button");
    btn.className = "preset-btn" + (key === current ? " active" : "");
    btn.textContent = "应用";
    btn.onclick = function() { applyPreset(key); };
    var input = document.createElement("input");
    input.className = "preset-name-input";
    input.value = displayName;
    input.dataset.preset = key;
    input.addEventListener("change", function() {
      var names = loadPresetNames();
      var trimmed = this.value.trim();
      names[key] = trimmed || EVENT_PRESETS[key].name;
      if (!trimmed) this.value = EVENT_PRESETS[key].name;
      savePresetNames(names);
    });
    wrap.appendChild(btn);
    wrap.appendChild(input);
    bar.appendChild(wrap);
  });
}
