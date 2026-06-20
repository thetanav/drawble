import { nanoid } from 'nanoid';
import type { Room, Player, RoomSettings, RoomListItem } from '@draw/shared';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH, DEFAULT_ROOM_SETTINGS } from '@draw/shared';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private playerToRoom = new Map<string, string>();

  generateCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
  }

  createRoom(hostId: string, hostName: string, avatarId: number, settings?: Partial<RoomSettings>): Room {
    const roomId = nanoid(12);
    const code = this.generateCode();
    const roomSettings = { ...DEFAULT_ROOM_SETTINGS, ...settings };

    const host: Player = {
      id: hostId,
      nickname: hostName,
      avatarId,
      ready: true,
      connected: true,
    };

    const room: Room = {
      id: roomId,
      code,
      host: hostId,
      settings: roomSettings,
      players: new Map([[hostId, host]]),
      status: 'lobby',
      game: null,
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostId, roomId);

    return room;
  }

  joinRoom(roomCode: string, playerId: string, playerName: string, avatarId: number): Room | null {
    const room = this.findRoomByCode(roomCode);
    if (!room) return null;
    if (room.status !== 'lobby') return null;
    if (room.players.size >= room.settings.maxPlayers) return null;

    const player: Player = {
      id: playerId,
      nickname: playerName,
      avatarId,
      ready: false,
      connected: true,
    };

    room.players.set(playerId, player);
    this.playerToRoom.set(playerId, room.id);

    return room;
  }

  leaveRoom(playerId: string): { room: Room; wasHost: boolean } | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const wasHost = room.host === playerId;
    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    if (wasHost) {
      const newHost = room.players.values().next().value!;
      room.host = newHost.id;
    }

    return { room, wasHost };
  }

  findRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  findRoomByCode(code: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.code === code) return room;
    }
    return undefined;
  }

  getRoomByPlayer(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  getRoomList(): RoomListItem[] {
    const list: RoomListItem[] = [];
    for (const room of this.rooms.values()) {
      if (room.status === 'lobby') {
        list.push({
          id: room.id,
          code: room.code,
          host: room.host,
          playerCount: room.players.size,
          maxPlayers: room.settings.maxPlayers,
          status: room.status,
          settings: {
            rounds: room.settings.rounds,
            drawTime: room.settings.drawTime,
          },
        });
      }
    }
    return list;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
