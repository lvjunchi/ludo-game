// 情侣飞行棋 - 棋盘

var cellPosCache = null;

function initBoard(gameStateRef) {
  var board = document.getElementById("gameBoard");
  board.innerHTML = "";
  cellPosCache = null;

  var pathSet = new Set(PATH.map(function(r) { return r[0] + "," + r[1]; }));
  var decorations = {
    "7,7": "❤️", "4,4": "💕", "4,10": "💑", "10,4": "🏠",
    "10,10": "🌹", "5,7": "⭐", "9,7": "⭐", "7,5": "⭐", "7,9": "⭐",
  };

  for (var row = 0; row < BOARD_SIZE; row++) {
    for (var col = 0; col < BOARD_SIZE; col++) {
      var cell = document.createElement("div");
      cell.className = "cell";
      cell.id = "cell-" + row + "-" + col;
      var key = row + "," + col;

      if (pathSet.has(key)) {
        var pathIndex = PATH_MAP[key];
        cell.textContent = pathIndex;
        cell.classList.add("on-path");
        cell.style.setProperty("--i", pathIndex);
        if (pathIndex < 14) cell.classList.add("section-0");
        else if (pathIndex < 28) cell.classList.add("section-1");
        else if (pathIndex < 42) cell.classList.add("section-2");
        else cell.classList.add("section-3");
        if (pathIndex === 0) cell.classList.add("start-p1");
      } else if (row >= 2 && row <= 12 && col >= 2 && col <= 12) {
        cell.classList.add("center-cell");
        if (decorations[key]) {
          cell.textContent = decorations[key];
          cell.classList.add("decoration");
          if (key === "7,7") cell.classList.add("heart");
        }
      }
      board.appendChild(cell);
    }
  }
  placePieces(gameStateRef);
}

function placePieces(gameStateRef) {
  if (gameStateRef.isAnimating) return;
  forEach([1, 2], function(pid) {
    var player = gameStateRef.players[pid];
    var old = document.querySelector(".piece.p" + pid + ":not(.moving)");
    if (old) old.remove();
    if (player.pos === -1) return;
    var pos = PATH[player.pos];
    var cell = document.getElementById("cell-" + pos[0] + "-" + pos[1]);
    if (cell) {
      var piece = document.createElement("div");
      piece.className = "piece p" + pid;
      piece.textContent = player.icon;
      cell.appendChild(piece);
    }
  });
}

function buildCellPosCache() {
  var board = document.querySelector(".game-board");
  if (!board) return;
  var boardRect = board.getBoundingClientRect();
  var style = getComputedStyle(board);
  var border = parseFloat(style.borderLeftWidth) || 0;
  var padding = parseFloat(style.paddingLeft) || 0;

  cellPosCache = {};
  forEach(PATH, function(coord, i) {
    var cell = document.getElementById("cell-" + coord[0] + "-" + coord[1]);
    if (cell) {
      var r = cell.getBoundingClientRect();
      var ps = r.width * 0.8;
      cellPosCache[i] = {
        x: r.left - boardRect.left - border - padding + r.width / 2 - ps / 2,
        y: r.top - boardRect.top - border - padding + r.height / 2 - ps / 2,
      };
    }
  });
}

function getCellPos(pathIndex) {
  if (!cellPosCache) buildCellPosCache();
  return cellPosCache[pathIndex] || { x: 0, y: 0 };
}

// forEach polyfill for NodeList compatibility
function forEach(arr, fn) {
  for (var i = 0; i < arr.length; i++) fn(arr[i], i);
}
