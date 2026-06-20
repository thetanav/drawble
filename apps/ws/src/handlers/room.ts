import type { Server, Socket } from 'socket.io';
import { EVENTS } from '@draw/shared';
import type { RoomManager } from '../state/roomManager.js';
import { serializeRoom } from './connection.js';

export function setupRoomHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  socket.on(
    EVENTS.ROOM_CREATE,
    (data: { nickname: string; avatarId: number; settings?: any }) => {
      const room = roomManager.createRoom(
        socket.id,
        data.nickname,
        data.avatarId,
        data.settings
      );

      socket.join(room.id);
      (socket as any).currentRoom = room.id;

      socket.emit(EVENTS.ROOM_STATE, serializeRoom(room));
      io.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());
    }
  );

  socket.on(
    EVENTS.ROOM_JOIN,
    (data: { roomCode: string; nickname: string; avatarId: number }) => {
      const playerData = (socket as any).playerData;
      const nickname = data.nickname || playerData?.nickname || 'Player';
      const avatarId = data.avatarId ?? playerData?.avatarId ?? 0;

      const room = roomManager.joinRoom(
        data.roomCode.toUpperCase(),
        socket.id,
        nickname,
        avatarId
      );

      if (!room) {
        socket.emit(EVENTS.ERROR, { message: 'Room not found or full' });
        return;
      }

      socket.join(room.id);
      (socket as any).currentRoom = room.id;

      socket.emit(EVENTS.ROOM_STATE, serializeRoom(room));
      socket.to(room.id).emit(EVENTS.ROOM_STATE, serializeRoom(room));
      io.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());
    }
  );

  socket.on(EVENTS.ROOM_LEAVE, () => {
    const roomId = (socket as any).currentRoom;
    if (!roomId) return;

    const result = roomManager.leaveRoom(socket.id);
    if (result) {
      socket.leave(roomId);
      (socket as any).currentRoom = null;

      socket.emit(EVENTS.ROOM_STATE, null);
      io.to(roomId).emit(EVENTS.ROOM_STATE, serializeRoom(result.room));
      io.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());
    }
  });

  socket.on(EVENTS.ROOM_LIST, () => {
    socket.emit(EVENTS.ROOM_LIST_UPDATE, roomManager.getRoomList());
  });
}
