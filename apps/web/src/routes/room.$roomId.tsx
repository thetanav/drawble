import { useCallback, useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AVATARS, BRUSH_SIZES, CANVAS_COLORS } from '@draw/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlayerStore, useRoomStore, useGameStore, useChatStore } from '@/stores';
import { useSocket } from '@/hooks/useSocket';
import { formatTime } from '@/lib/utils';
import { drawStroke } from '@/lib/canvas';
import { getSocket } from '@/lib/socket';

export const Route = createFileRoute('/room/$roomId')({
  component: RoomComponent,
});

function RoomComponent() {
  const navigate = useNavigate();
  const { nickname, id: playerId } = usePlayerStore();
  const { currentRoom } = useRoomStore();
  const { gameState, wordChoices, timeLeft, setTimeLeft } = useGameStore();
  const { messages } = useChatStore();
  const { leaveRoom, startGame, selectWord, sendGuess, sendDrawing, endDrawing, sendChat, setReady } =
    useSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const [selectedWord, setSelectedWord] = useState('');
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  const isDrawer = gameState?.currentDrawer === playerId;
  const players = currentRoom ? Array.from(currentRoom.players.values()) : [];
  const currentPlayer = currentRoom?.players.get(playerId ?? '');
  const isReady = currentPlayer?.ready ?? false;
  const allPlayersReady = players.length > 1 && players.every((player) => player.ready);
  const shownWord = selectedWord || gameState?.currentWord || '';

  useEffect(() => {
    if (!currentRoom) {
      navigate({ to: '/' });
    }
  }, [currentRoom, navigate]);

  useEffect(() => {
    const socket = getSocket();
    const handleTick = (data: { timeLeft: number }) => setTimeLeft(data.timeLeft);
    const handleStroke = (data: any) => drawRemoteStroke(data.stroke);

    socket.on('timer:tick', handleTick);
    socket.on('game:drawing-data', handleStroke);

    return () => {
      socket.off('timer:tick', handleTick);
      socket.off('game:drawing-data', handleStroke);
    };
  }, [setTimeLeft]);

  useEffect(() => {
    if (gameState?.phase === 'choosing') {
      setSelectedWord('');
    }
  }, [gameState?.phase]);

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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    currentStrokeRef.current = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    currentStrokeRef.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    if (e.key !== 'Enter') return;
    if (isDrawer) handleChat();
    else handleGuess();
  };

  if (!currentRoom) return null;

  return (
    <div className="min-h-screen p-3">
      <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_260px]">
        <Card className="border-white/15 bg-slate-950/70 text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-lg">
              Room <span className="text-slate-300">{currentRoom.code}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{nickname}</span>
              <Button variant="ghost" size="sm" onClick={leaveRoom}>
                Leave
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {gameState?.phase === 'choosing' && (
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  {isDrawer ? 'Pick a word:' : 'Waiting for the drawer to choose a word.'}
                </p>
                {isDrawer ? (
                  <div className="flex flex-wrap gap-2">
                    {wordChoices.map((word) => (
                      <Button
                        key={word}
                        onClick={() => {
                          setSelectedWord(word);
                          selectWord(word);
                        }}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {gameState?.phase === 'drawing' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>
                    Round {gameState.currentRound}/{gameState.totalRounds}
                  </span>
                  {timeLeft > 0 ? <span>{formatTime(timeLeft)}</span> : null}
                </div>

                {isDrawer ? (
                  <p className="text-sm text-slate-300">
                    Word: <span className="font-semibold text-white">{shownWord}</span>
                  </p>
                ) : (
                  <p className="text-center text-lg tracking-[0.25em] text-slate-300">
                    {gameState.hints.map((hint, index) => (
                      <span key={index}>{hint === '_' ? ' _ ' : hint}</span>
                    ))}
                  </p>
                )}

                <canvas
                  ref={canvasRef}
                  width={800}
                  height={480}
                  className="w-full rounded-md bg-white"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />

                {isDrawer ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={selectedTool === 'pen' ? 'default' : 'outline'}
                      onClick={() => setSelectedTool('pen')}
                    >
                      Pen
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTool === 'eraser' ? 'default' : 'outline'}
                      onClick={() => setSelectedTool('eraser')}
                    >
                      Eraser
                    </Button>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex gap-2">
                      {CANVAS_COLORS.slice(0, 6).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`h-5 w-5 rounded-full border ${
                            selectedColor === color ? 'border-white' : 'border-white/20'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex gap-2">
                      {Object.entries(BRUSH_SIZES).map(([name, size]) => (
                        <Button
                          key={name}
                          size="sm"
                          variant={brushSize === size ? 'default' : 'outline'}
                          onClick={() => setBrushSize(size)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {gameState?.phase === 'paused' || gameState?.phase === 'roundEnd' ? (
              <p className="text-sm text-slate-300">
                Round over. {shownWord ? `Word: ${shownWord}` : ''}
              </p>
            ) : null}

            {currentRoom.status === 'lobby' ? (
              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                <Button onClick={() => setReady(!isReady)} variant="outline">
                  {isReady ? 'Unready' : 'Ready'}
                </Button>
                {currentRoom.host === playerId ? (
                  <Button
                    onClick={startGame}
                    disabled={players.length < 2 || !allPlayersReady}
                  >
                    Start
                  </Button>
                ) : null}
                {currentRoom.host === playerId && !allPlayersReady ? (
                  <p className="w-full text-xs text-slate-400">
                    Waiting for every player to mark ready.
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border-white/15 bg-slate-950/70 text-white">
            <CardHeader>
              <CardTitle className="text-base">Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${
                    gameState?.currentDrawer === player.id
                      ? 'border-white/20 bg-white/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span>{AVATARS[player.avatarId]?.emoji || '😀'}</span>
                  <span className="flex-1 truncate">{player.nickname}</span>
                  <span className={`text-xs ${player.ready ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {player.ready ? 'Ready' : 'Not ready'}
                  </span>
                  {player.id === currentRoom.host ? <span>★</span> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/15 bg-slate-950/70 text-white">
            <CardHeader>
              <CardTitle className="text-base">Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-60 space-y-2 overflow-auto text-sm">
                {messages.map((msg) => (
                  <div key={msg.id} className="text-slate-300">
                    {msg.type !== 'system' ? <strong>{msg.playerName}: </strong> : null}
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isDrawer ? 'Chat' : 'Guess'}
                  className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                />
                <Button onClick={isDrawer ? handleChat : handleGuess}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
