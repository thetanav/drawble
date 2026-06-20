import type { Server, Socket } from 'socket.io';
import { EVENTS } from '@draw/shared';
import type { RoomManager } from '../state/roomManager.js';

export function setupChatHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  socket.on(EVENTS.CHAT_SEND, (data: { text: string }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const message = {
      id: Math.random().toString(36).slice(2),
      playerId: socket.id,
      playerName: player.nickname,
      text: data.text,
      type: 'chat' as const,
      timestamp: Date.now(),
    };

    io.to(room.id).emit(EVENTS.CHAT_MESSAGE, message);
  });

  socket.on(EVENTS.PLAYER_READY, (data: { ready: boolean }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.ready = data.ready;
    io.to(room.id).emit(EVENTS.ROOM_STATE, {
      ...room,
      players: Array.from(room.players.values()),
      game: null,
    });
  });
}
