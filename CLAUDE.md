# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

情侣飞行棋 — 一个情侣互动空间，包含飞行棋等互动玩法。纯 HTML + CSS + JavaScript 实现，无构建工具、无依赖。直接在浏览器中打开 `index.html` 即可。

## 运行方式

无需构建或安装。直接在浏览器中打开 `index.html`。测试 PWA 功能时需通过 HTTP 服务（如 `npx serve .`）。

## 项目结构

- `index.html` — 唯一的 HTML 入口，包含棋盘结构、控制区、工具栏及各编辑器弹窗
- `css/style.css` — 所有样式，通过 CSS 自定义属性实现三主题切换（light/dark/lumu）
- `sw.js` — Service Worker，HTML 和静态资源按完整缓存版本一起更新（cache-first）
- `manifest.json` — PWA 清单，支持"添加到主屏幕"

### JS 模块（按加载顺序）

| 文件 | 职责 | 关键函数/变量 |
|------|------|---------------|
| `constants.js` | 棋盘路径数据、游戏参数常量 | `PATH`, `PATH_MAP`, `BOARD_SIZE`, `TOTAL_CELLS` |
| `storage.js` | localStorage 读写封装 | `loadPlayers()`, `savePlayers()`, `loadStats()`, `saveStats()` |
| `db.js` | IndexedDB 封装（相册） | `openDB()`, `addPhoto()`, `getPhotos()`, `deletePhoto()` |
| `board.js` | 棋盘创建、棋子放置/移动动画 | `initBoard()`, `placePieces()`, `animateMove()` |
| `events.js` | 格子事件数据、预设方案、事件编辑器 | `DEFAULT_EVENTS`, `EVENT_PRESETS`, `openEditor()`, `applyPreset()` |
| `dice.js` | 3D 骰子渲染与投掷逻辑 | `initDice()`, `renderDice()`, `_rollDice()` |
| `ui.js` | 弹窗、消息、首选项 UI | `showPopup()`, `showMessage()`, `openPhotoEditor()`, `openStats()` |
| `audio.js` | Web Audio API 音效与骰子滚动音效 | `playSound()`, `playDiceTick()`, `AudioCtx` |
| `home.js` | 首页渲染（情侣信息、统计、成就） | `renderHomePage()`, `openSettings()`, `openAlbum()` |
| `movement.js` | 棋子移动逻辑与胜负判定 | `movePiece()`, `afterMove()`, `showWin()` |
| `game.js` | 入口文件：状态管理、事件绑定、游戏控制 | `gameState`, `resetGame()`, `actionHandlers`, `rollDice()` |

### 加载顺序（index.html）

```
constants → audio → storage → ui → db → events → board → movement → dice → home → backup → game → pwa
```

所有模块使用 `var` 声明全局变量/函数，通过 `data-action` 属性绑定事件，由 `game.js` 的 `actionHandlers` 统一调度。

## 架构核心

### 页面结构

应用采用双页面架构：

- **首页** (`#homePage`) — `renderHomePage()` 动态渲染情侣信息、恋爱天数、游戏统计、成就等
- **游戏页** (`.game-container`) — 飞行棋游戏，通过 `handleStartGame()` 切换，`handleGoHome()` 返回首页

首次进入游戏时初始化棋盘和骰子（`gameInitialized` 标志控制），之后保留状态。

### 棋盘系统

- 15×15 网格，`PATH` 数组定义 56 格外围环形路径（从 `[14,0]` 沿四边前进）
- `PATH_MAP` 提供 `行,列 → 路径索引` 的 O(1) 查找
- `initBoard()` 创建棋盘，`placePieces()` 放置棋子，`animateMove()` 驱动棋子移动动画
- 移动动画使用 `setTimeout` 链式推进，`currentGeneration` 计数器确保过期回调失效

### 游戏状态

```js
{
  currentPlayer: 1 | 2,
  diceValue: 1-6,
  isRolling: false,
  gameOver: false,
  isAnimating: false,
  isTurnBusy: false,
  pendingEvent: null,
  players: {
    1: { pos: -1 | 0-55, icon: "🐺", name: "鹿角虫", startCell: 0, netMove: 0 },
    2: { pos: -1 | 0-55, icon: "🐷", name: "小曦曦", startCell: 0, netMove: 0 }
  }
}
```

- `pos` — PATH 索引，`-1` 表示未出发
- `netMove` — 累计净移动步数，`>= 56` 触发胜利（停在索引 55）
- `isTurnBusy` 锁住投掷、移动和任务阶段，只有完成/跳过任务后才解锁并换人

### 游戏流程

1. `rollDice()` → 调用 `dice.js` 的 `_rollDice()` → 3D 立方体旋转 + 嘀嗒音效
2. `movePiece()` → 移动棋子 → `animateMove()` 逐步推进（每步 350ms）
3. `afterMove()` → 格子事件任务 → 点击完成/跳过 → `nextTurn()` 切换玩家
4. netMove >= 56 → `showWin()` → Canvas 烟花 + 安慰动画 + 更新统计

### 事件系统

应用使用 `data-action` 属性绑定事件，替代传统的 `onclick`：

```html
<button data-action="rollDice">掷骰子</button>
```

`game.js` 中的 `actionHandlers` 对象映射 `action` 到处理函数，`bindEventListeners()` 通过全局事件委托捕获点击。添加新功能时只需在 `actionHandlers` 中注册即可。

### 持久化

- **localStorage**：格子事件、主题、先手、照片、统计、玩家数据、背景动画开关、纪念日、成就
- **IndexedDB**：相册照片存储，通过 `db.js` 的 `openDB()` / `addPhoto()` 等操作
- **Service Worker**：`sw.js` 缓存所有 JS/CSS/HTML，新版本安装完成后由 `pwa.js` 提示更新；每次发布递增 `CACHE_NAME`
- **备份**：`backup.js` 导出 localStorage 配置与 IndexedDB 照片/回忆；恢复先校验，IndexedDB 两张表同一事务写入，事务失败回滚配置。支持覆盖和去重合并

### 键盘快捷键

- `Space` — 掷骰子（首页可见或弹窗打开时禁用）
- `R` — 重置游戏

### 并发安全

`currentGeneration` 在重置时递增，所有 `setTimeout`/`setInterval` 回调在执行前检查捕获的 generation 值，不匹配则跳过。修改异步逻辑时必须沿用此模式。

### 音效与触觉

- 音效通过 Web Audio API 振荡器生成：`playSound("dice"|"move"|"event"|"win")`
- 骰子滚动时播放噪声+带通滤波的碰撞音效（`playDiceTick()`）
- 触觉反馈通过 `navigator.vibrate(pattern)`

### 已知设计细节

- 格子 0（起点）同时是玩家 1 和 2 的起点：`startCell: 0`
- 出发时 `netMove = dice`，`pos = startCell + dice - 1`（掷出 1 落在第 0 格）
- 事件任务保留到点击完成/跳过，返回首页保留任务，重进游戏恢复；投掷/移动中返回首页会提示等待
- 新照片最长边 1600px，头像 320px，优先 WebP；旧照片原样保留
- Canvas 庆祝特效持续 7 秒：彩带 + 烟花 + 闪烁星星 + 输家安慰 emoji 从底部升起
- 先手切换会调用 `resetGame()`
- 3D 骰子使用纯 JS 控制旋转（每 85ms 随机旋转），通过 CSS transition 平稳停靠
- CSS 响应式断点：`>= 768px` 桌面端 / `480-767px` 平板（两行工具栏） / `< 480px` 手机端
