import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  DEFAULT_ROOM_SETTINGS,
  MAX_DRAW_TIME,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_DRAW_TIME,
  MIN_PLAYERS,
  MIN_ROUNDS,
  type RoomListItem,
  type RoomSettings,
  type WordPack,
} from '@draw/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlayerStore, useRoomStore } from '@/stores';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';

export const Route = createFileRoute('/lobby')({
  validateSearch: (search: Record<string, unknown>) => ({
    action: (search.action as string) || 'browse',
  }),
  component: LobbyComponent,
});

function LobbyComponent() {
  const navigate = useNavigate();
  const { action } = Route.useSearch();
  const { nickname } = usePlayerStore();
  const { currentRoom } = useRoomStore();
  const { joinSocket, createRoom, joinRoom, requestRoomList } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);

  useEffect(() => {
    joinSocket();
    requestRoomList();
  }, [joinSocket, requestRoomList]);

  useEffect(() => {
    if (currentRoom) {
      navigate({ to: '/room/$roomId', params: { roomId: currentRoom.id } });
    }
  }, [currentRoom, navigate]);

  useEffect(() => {
    const handleRoomList = (list: RoomListItem[]) => setRooms(list);
    const socket = getSocket();
    socket.on('room:list:update', handleRoomList);

    return () => {
      socket.off('room:list:update', handleRoomList);
    };
  }, []);

  const handleCreateRoom = () => createRoom(settings);

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase());
  };

  const handleJoinDirect = (code: string) => {
    joinRoom(code);
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="mx-auto flex w-xl flex-col gap-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Lobby</CardTitle>
            <CardDescription>Signed in as {nickname || 'Player'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {action === 'create' ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Players</span>
                    <Input
                      type="number"
                      min={MIN_PLAYERS}
                      max={MAX_PLAYERS}
                      value={settings.maxPlayers}
                      onChange={(e) =>
                        setSettings((current) => ({
                          ...current,
                          maxPlayers: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Rounds</span>
                    <Input
                      type="number"
                      min={MIN_ROUNDS}
                      max={MAX_ROUNDS}
                      value={settings.rounds}
                      onChange={(e) =>
                        setSettings((current) => ({
                          ...current,
                          rounds: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Draw time</span>
                    <Input
                      type="number"
                      min={MIN_DRAW_TIME}
                      max={MAX_DRAW_TIME}
                      value={settings.drawTime}
                      onChange={(e) =>
                        setSettings((current) => ({
                          ...current,
                          drawTime: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Word pack</span>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={settings.wordPack}
                      onChange={(e) =>
                        setSettings((current) => ({
                          ...current,
                          wordPack: e.target.value as WordPack,
                        }))
                      }
                    >
                      <option value="general">General</option>
                      <option value="food">Food</option>
                      <option value="animals">Animals</option>
                      <option value="objects">Objects</option>
                      <option value="nature">Nature</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                </div>
                <Button onClick={handleCreateRoom}>Create</Button>
              </div>
            ) : null}
            {action === 'join' && (
              <>
                <Input
                  placeholder="Room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Button onClick={handleJoinRoom} disabled={roomCode.length < 6}>
                  Join
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Rooms</CardTitle>
            <CardDescription>Join any open lobby.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto">
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rooms yet.</p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <div>
                    <p className="font-medium">Room {room.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {room.playerCount}/{room.maxPlayers} players
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoinDirect(room.code)}
                    disabled={room.playerCount >= room.maxPlayers}
                  >
                    Join
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
