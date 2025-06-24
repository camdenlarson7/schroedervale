const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let players = [];  // list of connected socket ids
let currentTurnIndex = 0;

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  players.push(socket.id);

  // If this is the first player, assign the turn
  if (players.length === 1) {
    io.emit("turn", players[0]);
  }

  socket.on("submit", (message) => {
    io.emit("message", message);
    
    // Rotate turn to the next player
    currentTurnIndex = (currentTurnIndex + 1) % players.length;
    io.emit("turn", players[currentTurnIndex]);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove from player list
    const index = players.indexOf(socket.id);
    if (index !== -1) {
      players.splice(index, 1);

      // Adjust turn index if necessary
      if (currentTurnIndex >= players.length) {
        currentTurnIndex = 0;
      }

      // Emit new turn if players remain
      if (players.length > 0) {
        io.emit("turn", players[currentTurnIndex]);
      } else {
        io.emit("turn", null);
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
