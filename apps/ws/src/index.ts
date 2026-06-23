import { Server } from 'socket.io';
import { createServer } from 'http';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { EVENTS } from '@draw/shared';
import { RoomManager } from './state/roomManager.js';
import { GameEngine } from './game/engine.js';
import { setupConnectionHandlers } from './handlers/connection.js';
import { setupRoomHandlers } from './handlers/room.js';
import { setupGameHandlers } from './handlers/game.js';
import { setupChatHandlers } from './handlers/chat.js';
import { serializeRoom } from './handlers/connection.js';

const PORT = parseInt(process.env.WS_PORT || '3001');
const API_URL = process.env.API_URL || 'http://localhost:3000';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  })
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app.fetch as any);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  setupConnectionHandlers(io, socket, roomManager, gameEngine);
  setupRoomHandlers(io, socket, roomManager);
  setupGameHandlers(io, socket, roomManager, gameEngine);
  setupChatHandlers(io, socket, roomManager);

  socket.on(EVENTS.ROOM_LIST, () => {
    socket.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());
  });
});

setInterval(() => {
  const rooms = roomManager.getAllRooms();
  rooms.forEach((room) => {
    if (room.game && room.game.phase === 'drawing') {
      room.game.timer--;
      io.to(room.id).emit(EVENTS.TIMER_TICK, { timeLeft: room.game.timer });

      if (room.game.timer <= 0) {
        room.game.phase = 'paused';
        gameEngine.clearTimer(room.id);
        gameEngine.clearHintTimer(room.id);
        io.to(room.id).emit(EVENTS.GAME_ROUND_END, {
          word: room.game.currentWord,
          leaderboard: gameEngine.getLeaderboard(room),
        });
      }
    }
  });
}, 1000);

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
