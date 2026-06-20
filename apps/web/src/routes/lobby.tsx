import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlayerStore, useRoomStore } from '@/stores';
import { useSocket } from '@/hooks/useSocket';
import { DEFAULT_ROOM_SETTINGS } from '@draw/shared';
import type { RoomListItem } from '@draw/shared';

export const Route = createFileRoute('/lobby')({
  validateSearch: (search: Record<string, unknown>) => ({
    action: (search.action as string) || 'browse',
  }),
  component: LobbyComponent,
});

function LobbyComponent() {
  const navigate = useNavigate();
  const { action } = Route.useSearch();
  const { nickname, avatarId } = usePlayerStore();
  const { currentRoom } = useRoomStore();
  const { joinSocket, createRoom, joinRoom, requestRoomList } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [rooms, setRooms] = useState<RoomListItem[]>([]);

  useEffect(() => {
    joinSocket();
    requestRoomList();
  }, []);

  useEffect(() => {
    if (currentRoom) {
      navigate({ to: '/room/$roomId', params: { roomId: currentRoom.id } });
    }
  }, [currentRoom]);

  useEffect(() => {
    const socket = usePlayerStore.getState();
    const handleRoomList = (list: RoomListItem[]) => {
      setRooms(list);
    };

    import('../lib/socket').then(({ getSocket }) => {
      const s = getSocket();
      s.on('room:list:update', handleRoomList);
      return () => {
        s.off('room:list:update', handleRoomList);
      };
    });
  }, []);

  const handleCreateRoom = () => {
    createRoom(DEFAULT_ROOM_SETTINGS);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      joinRoom(roomCode.trim().toUpperCase());
    }
  };

  const handleJoinDirect = (code: string) => {
    joinRoom(code);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Lobby</h1>
            <p className="text-gray-400">
              Welcome, <span className="text-purple-400 font-semibold">{nickname}</span>!
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: '/' })}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {action === 'create' && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Create Room</CardTitle>
                <CardDescription className="text-gray-300">
                  Set up a new game room
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  Room will be created with default settings:
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 5 rounds</li>
                  <li>• 80 seconds per turn</li>
                  <li>• Max 6 players</li>
                  <li>• General word pack</li>
                </ul>
                <Button
                  onClick={handleCreateRoom}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  🎨 Create Room
                </Button>
              </CardContent>
            </Card>
          )}

          {action === 'join' && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Join Room</CardTitle>
                <CardDescription className="text-gray-300">
                  Enter a room code to join
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter room code..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={roomCode.length < 6}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  🔗 Join Room
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Available Rooms</CardTitle>
              <CardDescription className="text-gray-300">
                Join an existing room or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-4xl mb-4">🏠</p>
                  <p>No rooms available</p>
                  <p className="text-sm">Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">🎨</div>
                        <div>
                          <p className="text-white font-semibold">Room {room.code}</p>
                          <p className="text-sm text-gray-400">
                            {room.playerCount}/{room.maxPlayers} players • {room.settings.rounds}{' '}
                            rounds • {room.settings.drawTime}s
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinDirect(room.code)}
                        disabled={room.playerCount >= room.maxPlayers}
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
