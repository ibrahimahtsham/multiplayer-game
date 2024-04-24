const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

// Constants for customization
const BULLET_SPEED = 0.025;

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let gameState = {
  players: {},
  bullets: [],
  aliens: [
    { x: 0.2, y: 0.1 },
    { x: 0.4, y: 0.1 },
    { x: 0.6, y: 0.1 },
  ],
};

io.on("connection", handleConnection);

// Handles new client connections
function handleConnection(socket) {
  const playerId = socket.id;
  const initialColor =
    Object.keys(gameState.players).length === 0 ? "blue" : "red";
  gameState.players[playerId] = { x: 0.4, y: 0.8, color: initialColor };

  emitGameState();

  // Handle client disconnection
  socket.on("disconnect", () => {
    delete gameState.players[playerId];
    emitGameState();
  });

  // Handle player movement
  socket.on("move", (direction) => {
    handleMove(direction, playerId);
  });

  // Handle player shooting
  socket.on("shoot", () => {
    handleShoot(playerId);
  });
}

// Move player based on direction
function handleMove(direction, playerId) {
  const player = gameState.players[playerId];
  const moveDistance = 0.01; // 1% of canvas width
  if (direction === "left" && player.x > 0) {
    player.x -= moveDistance;
  } else if (direction === "right" && player.x < 1) {
    player.x += moveDistance;
  }
  emitGameState();
}

// Handle shooting logic
function handleShoot(playerId) {
  const player = gameState.players[playerId];

  // Adjust the y-coordinate of the bullet's spawn position
  const bulletSpawnY = player.y - 0.05; // 5% of canvas height above the player

  const newBullet = { x: player.x, y: bulletSpawnY, speed: BULLET_SPEED };
  gameState.bullets.push(newBullet);

  handleBulletCollision(newBullet);

  emitGameState();
}

// Check bullet collision with aliens
function handleBulletCollision(newBullet) {
  let bulletRemoved = false;

  for (let i = 0; i < gameState.aliens.length; i++) {
    const alien = gameState.aliens[i];
    const bottomBulletY = newBullet.y;
    const topAlienY = alien.y;
    const topBulletY = newBullet.y;
    const bottomAlienY = alien.y + 0.05;

    const isCollidingX =
      newBullet.x >= alien.x && newBullet.x <= alien.x + 0.05;
    const isCollidingY =
      bottomBulletY >= topAlienY && topBulletY <= bottomAlienY;

    if (isCollidingX && isCollidingY) {
      gameState.aliens.splice(i, 1);
      bulletRemoved = true;
      break;
    }
  }

  if (bulletRemoved) {
    const bulletIndex = gameState.bullets.indexOf(newBullet);
    if (bulletIndex > -1) {
      gameState.bullets.splice(bulletIndex, 1);
    }
  }
}

// Main game loop
setInterval(() => {
  moveBullets();
  emitGameState();
}, 1000 / 30);

// Move bullets and emit updated game state
function moveBullets() {
  let bulletsToRemove = [];

  for (let bullet of gameState.bullets) {
    bullet.y -= bullet.speed;

    if (bullet.y < 0 || bullet.y > 1) {
      // Add bullets to remove list
      bulletsToRemove.push(bullet);
    }
  }

  // Remove bullets that are out of the visible area
  bulletsToRemove.forEach((bullet) => {
    const index = gameState.bullets.indexOf(bullet);
    if (index > -1) {
      gameState.bullets.splice(index, 1);
    }
  });
}

// Emit game state to all clients
function emitGameState() {
  io.emit("update", gameState);
}

// Set up static file serving
app.use(express.static(path.join(__dirname, "../public")));

// Start server
server.listen(3000, () => {
  console.log("Server started on port 3000");
});
