# 🎲 情侣飞行棋

一个情侣互动空间，包含飞行棋等互动玩法。纯前端实现，无需服务器，打开即玩。

## 🎮 在线体验

https://lvjunchi.github.io/ludo-game/

## ✨ 功能

- **飞行棋对战** — 双人轮流掷骰子走格子，触发自定义事件互动
- **3D 骰子** — 立方体旋转动画，带碰撞音效
- **主题切换** — 浅色/深色/橹穆（蓝粉）三套主题
- **自定义玩家** — 可修改名称和 Emoji 图标
- **游戏统计** — 自动记录总对局和各自胜场
- **格子事件** — 56 格自定义事件文本，支持浪漫/搞笑/冒险三组预设
- **胜利庆祝** — Canvas 烟花 + 彩带 + 安慰动画
- **动态背景** — 爱心/花瓣从上飘落
- **照片管理** — 玩家头像、相册（IndexedDB 存储）
- **成就系统** — 连胜、全勤等成就解锁
- **纪念日** — 记录恋爱天数
- **PWA 离线支持** — Service Worker 缓存，断网也可游玩

## 🚀 运行

无需构建或安装，直接打开 `index.html` 即可。

测试 PWA 功能时需通过 HTTP 服务：

```bash
npx serve .
```

## 🏗️ 技术栈

纯 HTML + CSS + JavaScript（ES5），零依赖、零构建工具。

- `localStorage` — 配置与数据持久化
- `IndexedDB` — 相册照片存储
- `Web Audio API` — 音效生成（无外部音频文件）
- `Canvas 2D` — 烟花庆祝特效
- `CSS 3D Transforms` — 3D 骰子
- `Service Worker` — 离线缓存

## 📁 项目结构

```
index.html         — 入口页面
sw.js              — Service Worker
manifest.json      — PWA 清单
css/
  style.css        — 全部样式（三主题 CSS 变量）
js/
  constants.js     — 棋盘路径数据、参数常量
  storage.js       — localStorage 封装
  db.js            — IndexedDB 封装
  board.js         — 棋盘与棋子动画
  events.js        — 格子事件与预设
  dice.js          — 3D 骰子
  ui.js            — 弹窗、首选项 UI
  audio.js         — 音效系统
  home.js          — 首页渲染
  movement.js      — 移动逻辑与胜负判定
  game.js          — 入口：状态管理、事件绑定
```

## 📝 License

MIT
