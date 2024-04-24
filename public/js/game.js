const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const socket = io.connect("https://d358-101-50-71-2.ngrok-free.app");

let gameState = {};

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("update", (receivedGameState) => {
  gameState = receivedGameState;
  renderGame();
});

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderPlayers() {
  for (let playerId in gameState.players) {
    const player = gameState.players[playerId];
    ctx.fillStyle = player.color;
    const playerSize = canvas.width * 0.05; // 5% of canvas width
    ctx.fillRect(
      player.x * canvas.width - playerSize / 2,
      player.y * canvas.height - playerSize / 2,
      playerSize,
      playerSize
    );
  }
}

function renderBullets() {
  ctx.fillStyle = "white";
  const bulletWidth = canvas.width * 0.01;
  const bulletHeight = canvas.height * 0.02;

  for (let bullet of gameState.bullets) {
    ctx.fillRect(
      bullet.x * canvas.width - bulletWidth / 2,
      bullet.y * canvas.height - bulletHeight / 2,
      bulletWidth,
      bulletHeight
    );
  }
}

function renderAliens() {
  for (let alien of gameState.aliens) {
    ctx.fillStyle = "green";
    const alienSize = canvas.width * 0.05; // 5% of canvas width
    ctx.fillRect(
      alien.x * canvas.width - alienSize / 2,
      alien.y * canvas.height - alienSize / 2,
      alienSize,
      alienSize
    );
  }
}

function renderGame() {
  clearCanvas();
  renderAliens();
  renderPlayers();
  renderBullets();
}

document.getElementById("leftButton").addEventListener("click", () => {
  socket.emit("move", "left");
});

document.getElementById("rightButton").addEventListener("click", () => {
  socket.emit("move", "right");
});

document.getElementById("shootButton").addEventListener("click", () => {
  socket.emit("shoot");
});

function handleKeyDown(event) {
  switch (event.keyCode) {
    case 37:
      socket.emit("move", "left");
      break;
    case 39:
      socket.emit("move", "right");
      break;
    case 32:
      socket.emit("shoot");
      break;
  }
}

document.addEventListener("keydown", handleKeyDown);

window.onload = function () {
  var canvas = document.getElementById("gameCanvas");
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.5;

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.5;
    renderGame();
  });
};
