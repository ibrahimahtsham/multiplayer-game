const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

// Constants for customization
const BULLET_SPEED = 0.025;
const PLAYER_SPEED = 0.0125;
const ALIEN_SPEED = 0.005;

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initial game state
const initialGameState = {
  players: {},
  bullets: [],
  aliens: [],
  gameOver: false, // Add this line
};

function getRandomColor() {
  const neonColors = [
    "#39FF14",
    "#FF073A",
    "#FFD300",
    "#00FFFF",
    "#FF00FF",
    "#1B03A3",
    "#FE59C2",
    "#BDFCC9",
    "#6E0DD0",
    "#D0FA1B",
  ];
  return neonColors[Math.floor(Math.random() * neonColors.length)];
}

// Current game state
let gameState = { ...initialGameState };

// Reset game state
function resetGameState() {
  gameState = { ...initialGameState };
}

io.on("connection", handleConnection);

// Handles new client connections
function handleConnection(socket) {
  const playerId = socket.id;

  // Update player object structure to include score
  socket.on("newPlayer", (username) => {
    const initialColor = getRandomColor();
    gameState.players[playerId] = {
      x: 0.5,
      y: 0.95,
      color: initialColor,
      username: username,
      score: 0, // Initialize score
    };
    emitGameState();
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    delete gameState.players[playerId];
    resetGameState(); // Reset the game state when a player disconnects
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
  const moveDistance = PLAYER_SPEED;
  if (direction === "left" && player.x > 0.025) {
    player.x -= moveDistance;
  } else if (direction === "right" && player.x < 1.0 - 0.03) {
    player.x += moveDistance;
  }
  emitGameState();
}

// Handle shooting logic
function handleShoot(playerId) {
  const player = gameState.players[playerId];

  // Adjust the y-coordinate of the bullet's spawn position
  const bulletSpawnY = player.y - 0.05; // 5% of canvas height above the player

  const newBullet = {
    x: player.x,
    y: bulletSpawnY,
    speed: BULLET_SPEED,
    playerId: playerId,
  }; // Attach playerId
  gameState.bullets.push(newBullet);

  handleBulletCollision(newBullet);

  emitGameState();
}

// Check bullet collision with aliens
function handleBulletCollision(newBullet) {
  let bulletRemoved = false;

  for (let i = 0; i < gameState.aliens.length; i++) {
    const alien = gameState.aliens[i];
    const isCollidingX =
      newBullet.x + 0.025 >= alien.x && newBullet.x <= alien.x + 0.025;
    const isCollidingY =
      newBullet.y + 0.025 >= alien.y && newBullet.y <= alien.y + 0.025;

    if (isCollidingX && isCollidingY) {
      gameState.aliens.splice(i, 1);
      bulletRemoved = true;

      // Find the player who shot the bullet and update their score
      for (let playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (playerId === newBullet.playerId) {
          player.score += 10; // Increment score by 10
          break;
        }
      }

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

// Generate aliens
function generateAliens() {
  if (Math.random() < 0.02) {
    // 2% chance to spawn an alien each frame
    const newAlien = { x: Math.random(), y: 0, speed: ALIEN_SPEED };
    gameState.aliens.push(newAlien);
  }
}

// Move aliens
function moveAliens() {
  for (let alien of gameState.aliens) {
    alien.y += alien.speed;

    // Check for collision with players
    for (let playerId in gameState.players) {
      const player = gameState.players[playerId];
      const isCollidingX =
        player.x < alien.x + 0.05 && player.x + 0.05 > alien.x;
      const isCollidingY =
        player.y < alien.y + 0.05 && player.y + 0.05 > alien.y;
      if (isCollidingX && isCollidingY) {
        gameState.gameOver = true; // Set the game over flag
        io.emit("alienCollision", "get rekt baka!!! >:3"); // Emit custom event with message
        setTimeout(() => {
          io.emit("alienCollision", "");
          resetGameState(); // Reset the game state
          gameState.gameOver = false; // Reset the game over flag
          gameState.aliens = []; // Clear aliens
          // Reset players positions and retain color and username and reset the score to 0
          for (let playerId in gameState.players) {
            gameState.players[playerId] = {
              x: 0.5,
              y: 0.95,
              color: gameState.players[playerId].color,
              username: gameState.players[playerId].username,
              score: 0,
            };
          }
        }, 3000); // After 3 seconds
        return;
      }
    }
  }
}

// Move bullets and emit updated game state
function moveBullets() {
  let bulletsToRemove = [];

  for (let bullet of gameState.bullets) {
    bullet.y -= bullet.speed;

    handleBulletCollision(bullet); // Add this line

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

// Main game loop
setInterval(() => {
  if (!gameState.gameOver) {
    // Add this line
    moveBullets();
    moveAliens();
    generateAliens();
  }
  emitGameState();
}, 1000 / 30);

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
