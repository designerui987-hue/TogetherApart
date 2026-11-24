import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@together-apart/shared';
import { RoomManager } from './RoomManager';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static client build if it exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'together-apart-server', timestamp: Date.now() });
});

app.get('/favicon.ico', (_req, res) => res.status(204).end());

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create Room
  socket.on('room:create', ({ playerName, character }, callback) => {
    const room = roomManager.createRoom();
    const result = room.addPlayer(socket, playerName, character);
    if (result.success) {
      callback({ success: true, room: room.getRoomState() });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Join Room
  socket.on('room:join', ({ roomCode, playerName }, callback) => {
    const code = roomCode.trim().toUpperCase();
    const room = roomManager.getRoom(code);
    if (!room) {
      return callback({ success: false, error: `Room ${code} was not found.` });
    }
    if (room.inGame) {
      return callback({ success: false, error: `Room ${code} is already in game.` });
    }

    const result = room.addPlayer(socket, playerName);
    if (result.success) {
      callback({ success: true, room: room.getRoomState() });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Select Character
  socket.on('room:select_character', ({ character }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room) {
      room.setCharacter(socket.id, character);
    }
  });

  // Ready Status
  socket.on('room:ready', ({ ready }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room) {
      room.setReady(socket.id, ready);
    }
  });

  // Start Game
  socket.on('game:start', () => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room) {
      room.startGame();
    }
  });

  // Player Transform Update (30-60 Hz)
  socket.on('player:update', ({ transform, isGrounded, isMoving }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room && room.inGame) {
      room.updatePlayerTransform(socket.id, transform, isGrounded, isMoving);
    }
  });

  // Special Ability
  socket.on('player:ability', ({ abilityType, position }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room && room.inGame) {
      room.handleAbility(socket.id, abilityType, position);
    }
  });

  // Interaction
  socket.on('player:interact', ({ action, targetId }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room && room.inGame) {
      room.handleInteract(socket.id, action, targetId);
    }
  });

  // Respawn
  socket.on('player:respawn', ({ checkpointId }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room && room.inGame) {
      room.handleRespawn(socket.id, checkpointId);
    }
  });

  // Emotes
  socket.on('player:emote', ({ emote }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room && room.inGame) {
      room.handleEmote(socket.id, emote);
    }
  });

  // Checkpoint reached
  socket.on('player:checkpoint', ({ checkpointId }) => {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room && room.inGame) {
      room.setCheckpoint(checkpointId);
    }
  });

  // Latency ping
  socket.on('ping', (timestamp, callback) => {
    callback(timestamp);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    const room = roomManager.findRoomBySocketId(socket.id);
    if (room) {
      room.removePlayer(socket.id);
      if (room.players.size === 0) {
        roomManager.removeRoom(room.code);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Together Apart server listening on http://localhost:${PORT}`);
});
