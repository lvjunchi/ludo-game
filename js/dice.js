// 情侣飞行棋 - 骰子

var DICE_LAYOUT = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

function initDice() {
  var dice = document.getElementById("dice");
  dice.innerHTML = "";
  var cube = document.createElement("div");
  cube.className = "dice-cube";
  cube.id = "diceCube";
  for (var val = 1; val <= 6; val++) {
    var face = document.createElement("div");
    face.className = "dice-face face-" + val;
    DICE_LAYOUT[val].forEach(function(has) {
      var pip = document.createElement("div");
      pip.className = has ? "pip on" : "pip";
      face.appendChild(pip);
    });
    cube.appendChild(face);
  }
  dice.appendChild(cube);
  renderDice(1);
}

function renderDice(value) {
  var cube = document.getElementById("diceCube");
  if (!cube) return;
  var rotations = {
    1: "rotateX(90deg)",
    2: "rotateY(0deg)",
    3: "rotateY(90deg)",
    4: "rotateY(-90deg)",
    5: "rotateY(180deg)",
    6: "rotateX(-90deg)",
  };
  cube.style.transform = rotations[value] || "rotateY(0deg)";
}

function _rollDice(gameState, currentGenRef, onMovePiece) {
  if (gameState.isRolling || gameState.gameOver || gameState.isAnimating) return;
  gameState.isRolling = true;
  var gen = currentGenRef.current;
  var cube = document.getElementById("diceCube");

  gameState.diceValue = Math.floor(Math.random() * 6) + 1;
  playSound("dice");
  vibrate([50, 30, 50]);

  cube.style.transition = "none";
  startDiceTicks(DICE_SPIN_FRAMES);
  var count = 0;
  var spinInterval = setInterval(function() {
    if (gen !== currentGenRef.current) { clearInterval(spinInterval); stopDiceTicks(); return; }
    count++;
    if (count <= DICE_SPIN_FRAMES) {
      var rx = Math.floor(Math.random() * 720);
      var ry = Math.floor(Math.random() * 720);
      cube.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
    }
    if (count > DICE_SPIN_FRAMES) {
      clearInterval(spinInterval);
      stopDiceTicks();
      cube.style.transition = "transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)";
      renderDice(gameState.diceValue);
      showMessage("掷出了 " + gameState.diceValue + " 点！");
      gameState.isRolling = false;
      vibrate(80);

      setTimeout(function() {
        if (gen !== currentGenRef.current) return;
        onMovePiece(gameState.currentPlayer);
      }, DICE_MOVE_DELAY);
    }
  }, DICE_SPIN_INTERVAL);
}
