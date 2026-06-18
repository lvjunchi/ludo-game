// 情侣飞行棋 - 常量与路径数据

var BOARD_SIZE = 15;
var TOTAL_CELLS = 56;

var PATH = [
  [14,0],[14,1],[14,2],[14,3],[14,4],[14,5],[14,6],[14,7],
  [14,8],[14,9],[14,10],[14,11],[14,12],[14,13],[14,14],
  [13,14],[12,14],[11,14],[10,14],[9,14],[8,14],[7,14],
  [6,14],[5,14],[4,14],[3,14],[2,14],[1,14],
  [0,14],[0,13],[0,12],[0,11],[0,10],[0,9],[0,8],
  [0,7],[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],
  [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
  [8,0],[9,0],[10,0],[11,0],[12,0],[13,0],
];

var PATH_MAP = {};
PATH.forEach(([r, c], i) => { PATH_MAP[`${r},${c}`] = i; });

var STEP_DELAY = 350;
var DICE_SPIN_FRAMES = 10;
var DICE_SPIN_INTERVAL = 85;
var DICE_MOVE_DELAY = 550;
var POPUP_DURATION = 1500;
var CONSOLATION_DURATION = 4000;
var WIN_MSG_DURATION = 5000;
var CELEBRATION_DURATION = 7;
var CONFETTI_COUNT = 200;
var STAR_COUNT = 40;
var FIREWORK_COUNT = 50;
var PHOTO_MAX_SIZE = 200;
var PHOTO_QUALITY = 0.7;
