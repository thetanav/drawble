import { Server } from 'socket.io';
import { createServer } from 'http';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { RoomManager } from './state/roomManager.js';
import { GameEngine } from './game/engine.js';
import { setupConnectionHandlers } from './handlers/connection.js';
import { setupRoomHandlers } from './handlers/room.js';
import { setupGameHandlers } from './handlers/game.js';
import { setupChatHandlers } from './handlers/chat.js';

const PORT = parseInt(process.env.PORT || '3001');
const corsOrigin = process.env.CORS_ORIGNS?.split(',') || ['http://localhost:5173'];

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app.fetch as any);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine();

io.on('connection', (socket) => {
  // console.log(`Client connected: ${socket.id}`);

  setupConnectionHandlers(io, socket, roomManager, gameEngine);
  setupRoomHandlers(io, socket, roomManager);
  setupGameHandlers(io, socket, roomManager, gameEngine);
  setupChatHandlers(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
