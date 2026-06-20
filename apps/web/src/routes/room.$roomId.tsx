import { useState, useEffect, useRef, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlayerStore, useRoomStore, useGameStore, useChatStore, useLeaderboardStore } from '@/stores';
import { useSocket } from '@/hooks/useSocket';
import { formatTime } from '@/lib/utils';
import { drawStroke } from '@/lib/canvas';
import { AVATARS, CANVAS_COLORS, BRUSH_SIZES } from '@draw/shared';

export const Route = createFileRoute('/room/$roomId')({
  component: RoomComponent,
});

function RoomComponent() {
  const navigate = useNavigate();
  const { roomId } = Route.useParams();
  const { id: playerId, nickname, avatarId } = usePlayerStore();
  const { currentRoom, setRoom } = useRoomStore();
  const { gameState, wordChoices, timeLeft, setTimeLeft } = useGameStore();
  const { messages, addMessage } = useChatStore();
  const { leaderboard } = useLeaderboardStore();
  const {
    leaveRoom,
    startGame,
    selectWord,
    sendGuess,
    sendDrawing,
    endDrawing,
    sendChat,
    setReady,
  } = useSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  const isDrawer = gameState?.currentDrawer === playerId;
  const players = currentRoom ? Array.from(currentRoom.players.values()) : [];

  useEffect(() => {
    if (!currentRoom) {
      navigate({ to: '/' });
    }
  }, [currentRoom]);

  useEffect(() => {
    const socket = usePlayerStore.getState();
    import('../lib/socket').then(({ getSocket }) => {
      const s = getSocket();

      s.on('timer:tick', (data: { timeLeft: number }) => {
        setTimeLeft(data.timeLeft);
      });

      s.on('game:drawing-data', (data: any) => {
        drawRemoteStroke(data.stroke);
      });

      return () => {
        s.off('timer:tick');
        s.off('game:drawing-data');
      };
    });
  }, []);

  const drawRemoteStroke = useCallback((stroke: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawStroke(ctx, stroke.points, stroke.color, stroke.width);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current = [{ x, y }];
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.push({ x, y });

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStroke(
      ctx,
      currentStrokeRef.current,
      selectedTool === 'eraser' ? '#FFFFFF' : selectedColor,
      selectedTool === 'eraser' ? brushSize * 3 : brushSize
    );

    sendDrawing({
      tool: selectedTool,
      points: currentStrokeRef.current,
      color: selectedTool === 'eraser' ? '#FFFFFF' : selectedColor,
      width: selectedTool === 'eraser' ? brushSize * 3 : brushSize,
    });
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && isDrawer) {
      endDrawing();
    }
    setIsDrawing(false);
    currentStrokeRef.current = [];
  };

  const handleGuess = () => {
    if (!chatInput.trim()) return;
    sendGuess(chatInput.trim());
    setChatInput('');
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isDrawer) {
        handleChat();
      } else {
        handleGuess();
      }
    }
  };

  if (!currentRoom) return null;

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Room <span className="text-purple-400">{currentRoom.code}</span>
            </h1>
            {gameState && (
              <Badge variant="secondary" className="bg-white/10 text-white">
                Round {gameState.currentRound}/{gameState.totalRounds}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            {timeLeft > 0 && (
              <div className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </div>
            )}
            <Button
              onClick={leaveRoom}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              Leave
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                {gameState?.phase === 'choosing' && isDrawer && (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Pick a word to draw!</h2>
                    <div className="flex justify-center gap-4">
                      {wordChoices.map((word) => (
                        <Button
                          key={word}
                          onClick={() => selectWord(word)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-6"
                        >
                          {word}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {gameState?.phase === 'choosing' && !isDrawer && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎨</div>
                    <p className="text-white text-lg">
                      Waiting for <span className="text-purple-400 font-semibold">
                        {players.find((p) => p.id === gameState.currentDrawer)?.nickname}
                      </span> to pick a word...
                    </p>
                  </div>
                )}

                {gameState?.phase === 'drawing' && (
                  <div className="space-y-4">
                    {isDrawer && (
                      <div className="text-center mb-4">
                        <p className="text-white">
                          Your word: <span className="text-yellow-400 font-bold text-xl">{gameState.currentWord}</span>
                        </p>
                      </div>
                    )}

                    {!isDrawer && gameState.hints && (
                      <div className="text-center mb-4">
                        <p className="text-3xl font-mono tracking-widest text-white">
                          {gameState.hints.map((h, i) => (
                            <span key={i} className={h === '_' ? 'text-gray-500' : 'text-green-400'}>
                              {h === '_' ? '___' : h}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}

                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        className="w-full bg-white rounded-lg cursor-crosshair"
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                    </div>

                    {isDrawer && (
                      <div className="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-lg">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={selectedTool === 'pen' ? 'default' : 'ghost'}
                            onClick={() => setSelectedTool('pen')}
                            className="text-white"
                          >
                            ✏️ Pen
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedTool === 'eraser' ? 'default' : 'ghost'}
                            onClick={() => setSelectedTool('eraser')}
                            className="text-white"
                          >
                            🧹 Eraser
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-white/20" />

                        <div className="flex gap-1">
                          {CANVAS_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`w-6 h-6 rounded-full border-2 ${
                                selectedColor === color ? 'border-white scale-125' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="w-px h-6 bg-white/20" />

                        <div className="flex gap-1">
                          {Object.entries(BRUSH_SIZES).map(([name, size]) => (
                            <Button
                              key={name}
                              size="sm"
                              variant={brushSize === size ? 'default' : 'ghost'}
                              onClick={() => setBrushSize(size)}
                              className="text-white capitalize"
                            >
                              {name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {gameState?.phase === 'roundEnd' && (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Round Over!</h2>
                    <p className="text-xl text-gray-300">
                      The word was: <span className="text-yellow-400 font-bold">{gameState.currentWord}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {currentRoom.status === 'lobby' && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🎮</div>
                  <h2 className="text-xl font-bold text-white mb-2">Game Lobby</h2>
                  <p className="text-gray-300 mb-4">
                    {players.length} player{players.length !== 1 ? 's' : ''} connected
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => setReady(true)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      ✅ Ready
                    </Button>
                    {currentRoom.host === playerId && (
                      <Button
                        onClick={startGame}
                        disabled={players.length < 2}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        🚀 Start Game
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Players</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      gameState?.currentDrawer === player.id
                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                        : 'bg-white/5'
                    }`}
                  >
                    <span className="text-2xl">{AVATARS[player.avatarId]?.emoji || '😀'}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {player.nickname}
                        {player.id === playerId && (
                          <span className="text-gray-400 text-xs ml-1">(you)</span>
                        )}
                      </p>
                      {gameState && (
                        <p className="text-xs text-gray-400">
                          {gameState.scores.get(player.id) || 0} pts
                        </p>
                      )}
                    </div>
                    {gameState?.currentDrawer === player.id && (
                      <span className="text-xs">🎨</span>
                    )}
                    {player.id === currentRoom.host && (
                      <span className="text-xs">👑</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Chat</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-sm ${
                        msg.type === 'correct'
                          ? 'text-green-400 font-semibold'
                          : msg.type === 'system'
                          ? 'text-gray-400 italic'
                          : msg.type === 'guess'
                          ? 'text-gray-500'
                          : 'text-gray-300'
                      }`}
                    >
                      {msg.type !== 'system' && (
                        <span className="font-semibold">{msg.playerName}: </span>
                      )}
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isDrawer ? 'Chat...' : 'Type your guess...'}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={isDrawer ? handleChat : handleGuess}
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {isDrawer ? '💬' : '🎯'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {leaderboard.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">🏆 Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                    >
                      <span className="text-lg font-bold text-yellow-400 w-6">
                        {entry.rank}
                      </span>
                      <span className="text-white text-sm flex-1">{entry.playerName}</span>
                      <span className="text-purple-400 font-semibold text-sm">
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
