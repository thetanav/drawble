import type { Server, Socket } from 'socket.io';
import { EVENTS } from '@draw/shared';
import type { RoomManager } from '../state/roomManager.js';
import type { GameEngine } from '../game/engine.js';

export function setupConnectionHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
  gameEngine: GameEngine
) {
  socket.on(EVENTS.PLAYER_JOIN, (data: { nickname: string; avatarId: number }) => {
    const playerId = socket.id;
    (socket as any).playerData = {
      nickname: data.nickname,
      avatarId: data.avatarId,
    };
    // console.log(`Player connected: ${data.nickname} (${playerId})`);

    socket.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());
  });

  socket.on('disconnect', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (room) {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        io.to(room.id).emit(EVENTS.ROOM_STATE, serializeRoom(result.room));
        io.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());

        if (result.room.status === 'playing' && room.game) {
          gameEngine.clearTimer(room.id);

          if (result.room.players.size === 0) {
            room.game = null;
            room.status = 'lobby';
          }
        }
      }
    }
    // console.log(`Player disconnected: ${socket.id}`);
  });
}

export function serializeRoom(room: any) {
  return {
    ...room,
    players: Array.from(room.players.values()),
    game: room.game
      ? {
          ...room.game,
          scores: Array.from(room.game.scores.entries()),
        }
      : null,
  };
}
