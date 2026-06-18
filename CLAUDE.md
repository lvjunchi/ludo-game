# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

情侣飞行棋 — 一个情侣互动空间，包含飞行棋等互动玩法。纯 HTML + CSS + JavaScript 实现，无构建工具、无依赖。直接在浏览器中打开 `index.html` 即可。

## 运行方式

无需构建或安装。直接在浏览器中打开 `index.html`。测试 PWA 功能时需通过 HTTP 服务（如 `npx serve .`）。

## 项目结构

- `index.html` — 唯一的 HTML 入口，包含棋盘结构、控制区、工具栏、事件编辑器和照片编辑器弹窗。
- `js/game.js` — 全部游戏逻辑和首页逻辑（~1549 行），通过 `onclick` 属性与 HTML 绑定。
- `sw.js` — Service Worker（~30 行），cache-first 策略，缓存 `index.html`、`css/style.css`、`js/game.js`、`manifest.json`。
- `css/style.css` — 所有样式，通过 CSS 自定义属性实现深/浅色主题切换。
- `manifest.json` — PWA 清单，支持移动端"添加到主屏幕"。

## 架构核心

### 页面结构

应用采用单文件双页面架构，通过 `display` 切换实现页面跳转：

- **首页** (`#homePage`) — 情侣互动空间入口，展示情侣信息、情话、统计、功能入口
- **游戏页** (`.game-container`) — 飞行棋游戏界面，初始隐藏

页面切换：`startGame()` 隐藏首页显示游戏页，`goHome()` 反之。游戏棋盘和骰子在首次进入游戏页时才初始化（`gameInitialized` 标志控制）。

### 首页模块

- **情侣信息区** — 头像（照片或 emoji）、昵称、爱心动画、恋爱天数（基于 `ludo_anniversary` 计算）
- **今日心动** — 每日固定一句情话（`LOVE_QUOTES` 数组，基于日期取模）
- **核心功能** — 开始游戏（主按钮）、回忆墙/成就/相册（Toast 提示"即将推出"）、设置
- **统计区** — 总对局、双方胜场、情侣等级（6 级：初识→心动→热恋→甜蜜→深爱→永恒）
- **底部文案** — 每日轮换温馨短句（`FOOTER_PHRASES`）

### 棋盘系统

- 15×15 网格，`PATH` 数组定义 56 格螺旋路径（从 `[14,0]` 逆时针向内），`PATH_MAP` 提供 `行,列 → 路径索引` 的 O(1) 查找。
- 路径分为 4 段（section-0 至 section-3），每段 14 格，各有不同底色。
- 棋盘通过 `initBoard()` 创建：遍历 15×15 网格，匹配 PATH 集合的格子标记为 `on-path`；不在路径上且在 `[2,12]` 范围内的中心格子为 `center-cell`，内嵌装饰图案爱心等。
- 棋子通过 DOM 创建，调用 `placePieces()` 将棋子元素直接追加到对应格子的 DOM 节点内。
- 动画中的棋子通过 `animateMove()` 创建为 `.moving` 元素，使用绝对定位（`left`/`top`）和 `setTimeout` 链式推进，通过 `currentGeneration` 计数器确保过期的动画回调不会执行。

### 游戏状态

单一 `gameState` 对象：

```js
{
  currentPlayer: 1 | 2,
  diceValue: 1-6,
  isRolling: false,
  gameOver: false,
  players: {
    1: { pos: -1 | 0-55, icon: "🐺", name: "鹿角虫", startCell: 0, netMove: 0 },
    2: { pos: -1 | 0-55, icon: "🐷", name: "小曦曦", startCell: 0, netMove: 0 }
  }
}
```

- `pos` — 当前在 PATH 中的索引，`-1` 表示未出发。
- `netMove` — 累计净移动步数，`>= 56` 触发胜利（停在索引 55）。
- 重置时 `currentGeneration++`，使所有未完成的异步回调自动失效。

### 游戏流程

1. 点击骰子 → `rollDice()` → 随机 1-6，播放摇晃动画（100ms × 10次），显示最终点数
2. `movePiece(playerId)` → 判断是否出发（`pos === -1`），如果 netMove >= 56 则胜利
3. `animateMove()` → 逐步推进棋子（每步 350ms），完成后回调
4. `afterMove()` → 触发格子事件弹窗（1500ms 后自动关闭），或直接下一回合
5. `nextTurn()` → 切换 `currentPlayer`

### 持久化

所有数据均通过 `localStorage` 存储：

| 键名 | 格式 | 说明 |
|------|------|------|
| `ludo_events` | `string[]` (JSON, 长度 56) | 格子事件文本 |
| `ludo_theme` | `"light"` / `"dark"` / `"lumu"` | 主题模式 |
| `ludo_first` | `"1"` / `"2"` | 先手玩家 |
| `ludo_photos` | `{ "1": string, "2": string }` (JSON) | 玩家照片 URL 或 Data URL |
| `ludo_stats` | `{ total, p1Wins, p2Wins }` (JSON) | 游戏统计 |
| `ludo_bg_anim` | `"0"` / `"1"` | 动态背景开关 |
| `ludo_players` | `{ "1": {name, icon}, "2": {name, icon} }` (JSON) | 玩家自定义名称和 emoji 图标 |
| `ludo_anniversary` | `string` (YYYY-MM-DD) | 在一起的纪念日，用于计算恋爱天数 |
| `ludo_achievements` | `{ unlocked: string[] }` (JSON) | 已解锁的成就 ID 列表 |
| `ludo_win_streak` | `number` (string) | 当前连胜次数 |
| `ludo_play_days` | `string[]` (JSON) | 游玩日期记录（YYYY-MM-DD），用于全勤奖检测 |

### 键盘快捷键

- `Space` — 摇骰子（等同点击骰子）
- `R` — 重置游戏

### 并发安全：generation 计数器

`currentGeneration` 是核心并发控制机制。每次重置游戏时 `currentGeneration++`，所有 `setTimeout`/`setInterval` 回调在执行前检查捕获的 generation 值是否仍等于当前值，不匹配则跳过。这确保了重置后旧的动画和回调不会干扰新游戏状态。修改异步逻辑时必须沿用此模式。

### 音效与触觉

- 音效通过 Web Audio API 振荡器生成（无外部音频文件）：`playSound("dice"|"move"|"event"|"win")`。
- 触觉反馈通过 `navigator.vibrate(pattern)`。
- 首次交互时创建 `AudioContext`（需用户手势触发）。

### CSS 响应式断点

- `>= 768px` — 桌面端，照片列可见，工具栏单行
- `480px–767px` — 平板，照片列隐藏，工具栏两行
- `< 480px` — 手机端，照片列隐藏，工具栏两行，3D 骰子缩小

### 事件编辑器

`openEditor()` 从 `CELL_EVENTS`（数组）渲染 56 个输入框。修改保存到 `localStorage`，`resetEvents()` 恢复 `DEFAULT_EVENTS`。编辑器覆盖层通过 `editor-overlay` CSS 类控制显隐。

### 照片编辑器

- 支持 URL 输入和本地文件上传（FileReader → Canvas 缩放最大 200px → Data URL）。
- 照片显示在棋盘左侧 `.photo-column` 区域，桌面端可见，`<= 767px` 隐藏。
- `photos` 对象从 `ludo_photos` 加载，通过 `renderPhotos()` 渲染。

### 已知设计细节

- 格子 0（起点）同时是玩家 1 的起点：`startCell: 0`，即所有玩家从 PATH[0] 出发。
- 出发时 `netMove = dice`，`pos = startCell + dice`，越过终点（`netMove >= 56`）时停在最后一格（索引 55）。
- 格子编号显示在路径格子上（0-55），但起点格子（索引 0）有特殊样式 `start-p1`。
- `animateMove` 的 `forward` 参数保留但始终为 `true`（仅用于正向移动）。
- 事件弹窗点击可提前关闭，3 秒后自动关闭。
- 胜利动画包含：emoji 从顶部下落（5 秒）+ Canvas 彩带 + 烟花粒子 + 闪烁星星背景（7 秒），通过 `showWin()` 创建。
- 胜利时自动更新 `gameStats`（总对局数 + 各自胜场），通过 `ludo_stats` 持久化。
- 先手切换会调用 `resetGame()`，以重新基于新先手初始化游戏。
- 动态背景通过 `bgAnimation` 容器实现，22 个浮动爱心/花瓣元素使用 CSS `floatUp` 动画，从底部向上飘浮并旋转，可通工具栏按钮切换，状态持久化。
- 3D 骰子使用纯 JS 控制旋转（每 85ms 随机旋转），最后通过 CSS transition 平稳停靠到目标面，不使用 CSS @keyframes 避免时序冲突。
