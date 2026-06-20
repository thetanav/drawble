import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerStore } from '@/stores';
import { AVATARS } from '@draw/shared';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const { nickname, avatarId, setNickname, setAvatarId, setPlayer } = usePlayerStore();
  const [selectedAvatar, setSelectedAvatar] = useState(avatarId);
  const [name, setName] = useState(nickname);

  const handleCreateRoom = () => {
    if (!name.trim()) return;
    setPlayer(crypto.randomUUID(), name.trim(), selectedAvatar);
    navigate({ to: '/lobby', search: { action: 'create' } });
  };

  const handleJoinRoom = () => {
    if (!name.trim()) return;
    setPlayer(crypto.randomUUID(), name.trim(), selectedAvatar);
    navigate({ to: '/lobby', search: { action: 'join' } });
  };

  const handleBrowseRooms = () => {
    if (!name.trim()) return;
    setPlayer(crypto.randomUUID(), name.trim(), selectedAvatar);
    navigate({ to: '/lobby', search: { action: 'browse' } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <CardTitle className="text-3xl font-bold text-white">Draw Simply Draw</CardTitle>
          <CardDescription className="text-gray-300">
            Draw, guess, and have fun with friends!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Your Nickname</label>
            <Input
              placeholder="Enter your nickname..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Choose Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    setSelectedAvatar(avatar.id);
                    setAvatarId(avatar.id);
                  }}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedAvatar === avatar.id
                      ? 'bg-purple-500 scale-110 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateRoom}
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
            >
              🎨 Create Room
            </Button>
            <Button
              onClick={handleJoinRoom}
              disabled={!name.trim()}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 py-6 text-lg"
            >
              🔗 Join Room
            </Button>
            <Button
              onClick={handleBrowseRooms}
              disabled={!name.trim()}
              variant="ghost"
              className="w-full text-gray-300 hover:text-white hover:bg-white/10 py-6 text-lg"
            >
              🔍 Browse Rooms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
