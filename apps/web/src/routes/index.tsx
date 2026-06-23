import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AVATARS } from '@draw/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlayerStore } from '@/stores';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const { nickname, avatarId, setAvatarId, setPlayer } = usePlayerStore();
  const [name, setName] = useState(nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarId);

  const enterLobby = (action: 'create' | 'join' | 'browse') => {
    if (!name.trim()) return;
    setPlayer(crypto.randomUUID(), name.trim(), selectedAvatar);
    navigate({ to: '/lobby', search: { action } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-white/15 bg-slate-950/70 text-white shadow-2xl shadow-black/30">
        <CardHeader className="space-y-2 text-center">
          <div className="text-4xl">🎨</div>
          <CardTitle className="text-2xl">Draw Simply Draw</CardTitle>
          <CardDescription className="text-slate-300">
            Minimal multiplayer sketch game.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nickname</label>
            <Input
              placeholder="Enter a name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.slice(0, 6).map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(avatar.id);
                    setAvatarId(avatar.id);
                  }}
                  className={`rounded-md border p-2 text-xl transition ${
                    selectedAvatar === avatar.id
                      ? 'border-white bg-white/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Button onClick={() => enterLobby('create')} disabled={!name.trim()}>
              Create Room
            </Button>
            <Button onClick={() => enterLobby('join')} variant="outline" disabled={!name.trim()}>
              Join Room
            </Button>
            <Button onClick={() => enterLobby('browse')} variant="ghost" disabled={!name.trim()}>
              Browse Rooms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
