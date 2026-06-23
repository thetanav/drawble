import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DEFAULT_ROOM_SETTINGS, type RoomListItem } from '@draw/shared';
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

  const handleCreateRoom = () => createRoom(DEFAULT_ROOM_SETTINGS);

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase());
  };

  const handleJoinDirect = (code: string) => {
    joinRoom(code);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Card className="border-white/15 bg-slate-950/70 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Lobby</CardTitle>
            <CardDescription className="text-slate-300">
              Signed in as {nickname || 'Player'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {action === 'create' ? (
              <Button onClick={handleCreateRoom}>Create</Button>
            ) : (
              <Input
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                maxLength={6}
              />
            )}
            {action === 'join' && (
              <Button onClick={handleJoinRoom} disabled={roomCode.length < 6}>
                Join
              </Button>
            )}
            {action === 'browse' && (
              <Button onClick={() => navigate({ to: '/' })} variant="outline">
                Back
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-slate-950/70 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Rooms</CardTitle>
            <CardDescription className="text-slate-300">Join any open lobby.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rooms.length === 0 ? (
              <p className="text-sm text-slate-400">No rooms yet.</p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">Room {room.code}</p>
                    <p className="text-xs text-slate-400">
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
