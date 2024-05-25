const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const socket = io.connect("http://localhost:3000");

// https://best-game-in-the-world.onrender.com
// http://localhost:3000

// Load the alien image
const alienImage = new Image();
const playerImage1 = new Image();
const playerImage2 = new Image();
const playerImage3 = new Image();
const playerImage4 = new Image();
const playerImage5 = new Image();
const playerImage6 = new Image();
const playerImage7 = new Image();
const playerImage8 = new Image();
const playerImage9 = new Image();
const playerImage10 = new Image();
playerImage1.src = "./images/spaceship.png";
playerImage2.src = "./images/spaceship2.png";
playerImage3.src = "./images/spaceship3.png";
playerImage4.src = "./images/spaceship4.png";
playerImage5.src = "./images/spaceship5.png";
playerImage6.src = "./images/spaceship6.png";
playerImage7.src = "./images/spaceship7.png";
playerImage8.src = "./images/spaceship8.png";
playerImage9.src = "./images/spaceship9.png";
playerImage10.src = "./images/spaceship10.png";
alienImage.src = "./images/alon.png"; // Provide the correct path to your image

alienImage.onload = function () {
  renderGame(); // Call renderGame after the image has loaded
};

playerImage1.onload = function () {
  renderGame(); // Call renderGame after the image has loaded
};

let gameState = {};
const PLAYER_SIZE = 0.05;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

socket.on("connect", () => {
  console.log("Connected to server");
  const username = prompt("Please enter your username:");
  socket.emit("newPlayer", username);
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

    //set player color
    ctx.fillStyle = player.color;

    const playerSize = canvas.width * PLAYER_SIZE; // 5% of canvas width
    const x = player.x * canvas.width - playerSize / 2;
    const y = player.y * canvas.height - playerSize / 2;
    switch (player.color) {
      case "#39FF14":
        ctx.drawImage(playerImage1, x, y, playerSize, playerSize);
        break;
      case "#FF073A":
        ctx.drawImage(playerImage2, x, y, playerSize, playerSize);
        break;
      case "#FFD300":
        ctx.drawImage(playerImage3, x, y, playerSize, playerSize);
        break;
      case "#00FFFF":
        ctx.drawImage(playerImage4, x, y, playerSize, playerSize);
        break;
      case "#FF00FF":
        ctx.drawImage(playerImage5, x, y, playerSize, playerSize);
        break;
      case "#1B03A3":
        ctx.drawImage(playerImage6, x, y, playerSize, playerSize);
        break;
      case "#FE59C2":
        ctx.drawImage(playerImage7, x, y, playerSize, playerSize);
        break;
      case "#BDFCC9":
        ctx.drawImage(playerImage8, x, y, playerSize, playerSize);
        break;
      case "#6E0DD0":
        ctx.drawImage(playerImage9, x, y, playerSize, playerSize);
        break;
      case "#D0FA1B":
        ctx.drawImage(playerImage10, x, y, playerSize, playerSize);
        break;
      default:
        ctx.drawImage(playerImage1, x, y, playerSize, playerSize);
        break;
    }


    // Display username above the player
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(
      player.username,
      player.x * canvas.width - playerSize / 2,
      player.y * canvas.height - playerSize / 2 - 15
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
  if (!alienImage.complete) {
    return; // Wait until the image is fully loaded
  }

  for (let alien of gameState.aliens) {
    const alienSize = canvas.width * 0.05; // 5% of canvas width
    const x = alien.x * canvas.width - alienSize / 2;
    const y = alien.y * canvas.height - alienSize / 2;

    // Draw the image
    ctx.drawImage(alienImage, x, y, alienSize, alienSize);
  }
}

function renderGame() {
  clearCanvas();
  renderAliens();
  renderPlayers();
  renderBullets();
  updateScoreDisplay(); // Add this line
}

function updateScoreDisplay() {
  const scoreDisplay = document.getElementById("scoreDisplay");
  let scoreHTML = "Scores:<br>";
  for (let playerId in gameState.players) {
    const player = gameState.players[playerId];
    scoreHTML += `${player.username}: ${player.score}<br>`;
  }
  scoreDisplay.innerHTML = scoreHTML;

  // Position score display in the middle left
  const canvasWidth = canvas.width;
  scoreDisplay.style.top = `${canvas.height / 2}px`;
  scoreDisplay.style.left = `${canvasWidth * 0.05}px`; // Adjust the percentage as needed
}

let intervalId;
const INTERVAL_VALUE = 70;
let buttonPressed = null; // Add this line

function startMovingLeft() {
  if (!buttonPressed) {
    // Add this line
    buttonPressed = "left"; // Add this line
    intervalId = setInterval(() => {
      socket.emit("move", "left");
    }, INTERVAL_VALUE);
  }
}

function startMovingRight() {
  if (!buttonPressed) {
    // Add this line
    buttonPressed = "right"; // Add this line
    intervalId = setInterval(() => {
      socket.emit("move", "right");
    }, INTERVAL_VALUE);
  }
}

function stopMoving() {
  clearInterval(intervalId);
  buttonPressed = null; // Add this line
}

document
  .getElementById("leftButton")
  .addEventListener("touchstart", startMovingLeft);
document.getElementById("leftButton").addEventListener("touchend", stopMoving);

document
  .getElementById("rightButton")
  .addEventListener("touchstart", startMovingRight);
document.getElementById("rightButton").addEventListener("touchend", stopMoving);

function startShooting() {
  if (!buttonPressed) {
    // Add this line
    buttonPressed = "shoot"; // Add this line
    intervalId = setInterval(() => {
      socket.emit("shoot");
    }, INTERVAL_VALUE);
  }
}

function stopShooting() {
  clearInterval(intervalId);
  buttonPressed = null; // Add this line
}

document
  .getElementById("shootButton")
  .addEventListener("touchstart", startShooting);
document
  .getElementById("shootButton")
  .addEventListener("touchend", stopShooting);

let keys = {};

function handleKeyDown(event) {
  keys[event.keyCode] = true;

  if (keys[37] || keys[65]) {
    // Left arrow key or 'a'
    socket.emit("move", "left");
  }

  if (keys[39] || keys[68]) {
    // Right arrow key or 'd'
    socket.emit("move", "right");
  }

  if (keys[32]) {
    // Space bar
    socket.emit("shoot");
  }
}

function handleKeyUp(event) {
  keys[event.keyCode] = false;
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

//toggle full screen
document
  .getElementById("fullscreenButton")
  .addEventListener("click", function () {
    var fullscreenButton = document.getElementById("fullscreenButton");

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.log);
      fullscreenButton.style.top = "0px";
      fullscreenButton.style.right = "0px";
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(console.log);
      fullscreenButton.style.top = "10px";
      fullscreenButton.style.right = "10px";
    }
  });

socket.on("alienCollision", (message) => {
  document.getElementById("gameOverMessage").innerHTML = message;
});

window.onload = function () {
  var canvas = document.getElementById("gameCanvas");
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.65;

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.65;
    renderGame();
  });
};
