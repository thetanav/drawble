import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AVATARS } from '@draw/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlayerStore } from '@/stores';
import { IconScribble } from '@tabler/icons-react';

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
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center">
          <IconScribble stroke={2} className="size-16" />
          <CardTitle className="text-2xl">Drawble</CardTitle>
          <CardDescription>Minimal multiplayer sketch game.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Nickname</label>
            <Input
              placeholder="Enter a name"
              value={name}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">Avatar</label>
            <div className="flex gap-1">
              {AVATARS.slice(0, 6).map((avatar) => (
                <Button
                  key={avatar.id}
                  size="icon-lg"
                  variant={selectedAvatar === avatar.id ? 'outline' : 'ghost'}
                  onClick={() => {
                    setSelectedAvatar(avatar.id);
                    setAvatarId(avatar.id);
                  }}
                >
                  <img className="size-6" src={`https://emojicdn.elk.sh/${avatar.emoji}`} />
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => enterLobby('create')}
              disabled={!name.trim()}
              size={'lg'}
              className="flex-1"
            >
              Create Room
            </Button>
            <Button
              onClick={() => enterLobby('join')}
              variant="outline"
              disabled={!name.trim()}
              size={'lg'}
              className="flex-1"
            >
              Join Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
