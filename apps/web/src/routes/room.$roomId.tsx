import { useCallback, useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  AVATARS,
  BRUSH_SIZES,
  CANVAS_COLORS,
  MAX_DRAW_TIME,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_DRAW_TIME,
  MIN_PLAYERS,
  MIN_ROUNDS,
  type RoomSettings,
  type WordPack,
} from '@draw/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  usePlayerStore,
  useRoomStore,
  useGameStore,
  useChatStore,
  useLeaderboardStore,
} from '@/stores';
import { useSocket } from '@/hooks/useSocket';
import { formatTime } from '@/lib/extras';
import { drawStroke, type CanvasPoint, type CanvasStroke } from '@/lib/canvas';
import { getSocket } from '@/lib/socket';

export const Route = createFileRoute('/room/$roomId')({
  component: RoomComponent,
});

type IncomingStroke = CanvasStroke & {
  strokeId?: string;
  isFinal?: boolean;
  playerId?: string;
};

function RoomComponent() {
  const navigate = useNavigate();
  const { nickname, id: playerId } = usePlayerStore();
  const { currentRoom } = useRoomStore();
  const { gameState, wordChoices, timeLeft, setTimeLeft } = useGameStore();
  const { messages } = useChatStore();
  const { leaderboard, isVisible: leaderboardVisible, celebrationToken } = useLeaderboardStore();
  const {
    leaveRoom,
    startGame,
    selectWord,
    sendGuess,
    sendDrawing,
    endDrawing,
    sendChat,
    setReady,
    updateRoomSettings,
  } = useSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const [selectedWord, setSelectedWord] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<RoomSettings | null>(null);
  const completedStrokesRef = useRef<CanvasStroke[]>([]);
  const activeStrokeRef = useRef<(CanvasStroke & { strokeId: string }) | null>(null);
  const remoteDraftStrokesRef = useRef<Map<string, CanvasStroke>>(new Map());
  const isPointerDownRef = useRef(false);
  const renderFrameRef = useRef<number | null>(null);
  const broadcastFrameRef = useRef<number | null>(null);
  const pendingBroadcastRef = useRef<IncomingStroke | null>(null);

  const isDrawer = gameState?.currentDrawer === playerId;
  const isHost = currentRoom?.host === playerId;
  const players = currentRoom ? Array.from(currentRoom.players.values()) : [];
  const currentPlayer = currentRoom?.players.get(playerId ?? '');
  const isReady = currentPlayer?.ready ?? false;
  const allPlayersReady = players.length > 1 && players.every((player) => player.ready);
  const shownWord = selectedWord || gameState?.currentWord || '';
  const confettiPieces = Array.from({ length: 28 }, (_, index) => {
    const left = (index * 13 + celebrationToken * 7) % 100;
    const delay = (index % 7) * 0.08;
    const duration = 2.1 + (index % 5) * 0.12;
    const size = 8 + (index % 4) * 3;
    const hue = (index * 29 + celebrationToken * 41) % 360;

    return {
      left: `${left}%`,
      delay: `${delay}s`,
      duration: `${duration}s`,
      size,
      backgroundColor: `hsl(${hue} 85% 62%)`,
    };
  });

  const getPlayerScore = (playerId: string) =>
    currentRoom?.game?.scores.get(playerId) ??
    leaderboard.find((entry) => entry.playerId === playerId)?.score ??
    0;

  const getCanvasPoint = (event: { clientX: number; clientY: number }): CanvasPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const appendPoints = (
    stroke: CanvasStroke & { strokeId: string },
    points: Array<{ clientX: number; clientY: number }>
  ) => {
    let lastPoint = stroke.points[stroke.points.length - 1] ?? null;

    for (const pointLike of points) {
      const point = getCanvasPoint(pointLike);
      if (!point) continue;

      if (lastPoint) {
        const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
        if (distance < 0.5) continue;
      }

      stroke.points.push(point);
      lastPoint = point;
    }
  };

  const scheduleRedraw = useCallback(() => {
    if (renderFrameRef.current !== null) return;

    renderFrameRef.current = window.requestAnimationFrame(() => {
      renderFrameRef.current = null;
      redrawAllStrokes();
    });
  }, []);

  const scheduleBroadcast = useCallback(
    (stroke: IncomingStroke) => {
      pendingBroadcastRef.current = {
        ...stroke,
        points: [...stroke.points],
      };

      if (broadcastFrameRef.current !== null) return;

      broadcastFrameRef.current = window.requestAnimationFrame(() => {
        broadcastFrameRef.current = null;
        const payload = pendingBroadcastRef.current;
        pendingBroadcastRef.current = null;
        if (payload) {
          sendDrawing(payload);
        }
      });
    },
    [sendDrawing]
  );

  useEffect(() => {
    return () => {
      if (renderFrameRef.current !== null) {
        window.cancelAnimationFrame(renderFrameRef.current);
      }
      if (broadcastFrameRef.current !== null) {
        window.cancelAnimationFrame(broadcastFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentRoom) {
      navigate({ to: '/' });
    }
  }, [currentRoom, navigate]);

  useEffect(() => {
    if (gameState?.phase === 'choosing') {
      setSelectedWord('');
    }
  }, [gameState?.phase]);

  useEffect(() => {
    if (!currentRoom) return;
    setSettingsDraft(currentRoom.settings);
  }, [
    currentRoom?.id,
    currentRoom?.settings.maxPlayers,
    currentRoom?.settings.rounds,
    currentRoom?.settings.drawTime,
    currentRoom?.settings.wordPack,
  ]);

  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of completedStrokesRef.current) {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.tool);
    }

    for (const stroke of remoteDraftStrokesRef.current.values()) {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.tool);
    }

    if (activeStrokeRef.current) {
      const stroke = activeStrokeRef.current;
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.tool);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scheduleRedraw();
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas.parentElement!);

    return () => observer.disconnect();
  }, [scheduleRedraw]);

  useEffect(() => {
    completedStrokesRef.current = [];
    remoteDraftStrokesRef.current.clear();
    activeStrokeRef.current = null;
    isPointerDownRef.current = false;
    redrawAllStrokes();
  }, [gameState?.phase, gameState?.currentRound, redrawAllStrokes]);

  const drawRemoteStroke = useCallback(
    (stroke: IncomingStroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!stroke.strokeId) return;

      const nextStroke: CanvasStroke = {
        points: stroke.points,
        color: stroke.color,
        width: stroke.width,
        tool: stroke.tool,
      };

      if (stroke.isFinal) {
        remoteDraftStrokesRef.current.delete(stroke.strokeId);
        completedStrokesRef.current.push(nextStroke);
      } else {
        remoteDraftStrokesRef.current.set(stroke.strokeId, nextStroke);
      }

      scheduleRedraw();
    },
    [scheduleRedraw]
  );

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
  }, [drawRemoteStroke, setTimeLeft]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || e.button !== 0) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;

    const strokeId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const tool = selectedTool;
    const width = tool === 'eraser' ? Math.max(12, brushSize * 2.5) : brushSize;
    const stroke: CanvasStroke & { strokeId: string } = {
      strokeId,
      points: [],
      color: tool === 'eraser' ? '#000000' : selectedColor,
      width,
      tool,
    };

    appendPoints(stroke, [e]);
    activeStrokeRef.current = stroke;
    scheduleRedraw();
    scheduleBroadcast({
      strokeId,
      points: stroke.points,
      color: stroke.color,
      width: stroke.width,
      tool,
      isFinal: false,
    });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isPointerDownRef.current || !activeStrokeRef.current) return;

    const activeStroke = activeStrokeRef.current;
    const nativeEvent = e.nativeEvent as PointerEvent & {
      getCoalescedEvents?: () => PointerEvent[];
    };
    const coalesced = nativeEvent.getCoalescedEvents?.() ?? [];
    appendPoints(activeStroke, coalesced.length > 0 ? coalesced : [nativeEvent]);
    if (activeStroke.points.length === 0) return;
    scheduleRedraw();
    scheduleBroadcast({
      strokeId: activeStroke.strokeId,
      points: activeStroke.points,
      color: activeStroke.color,
      width: activeStroke.width,
      tool: activeStroke.tool,
      isFinal: false,
    });
  };

  const finishStroke = () => {
    if (isDrawer && activeStrokeRef.current) {
      const stroke = activeStrokeRef.current;
      const finalizedStroke: CanvasStroke = {
        points: [...stroke.points],
        color: stroke.color,
        width: stroke.width,
        tool: stroke.tool,
      };

      completedStrokesRef.current.push(finalizedStroke);
      remoteDraftStrokesRef.current.delete(stroke.strokeId);
      if (broadcastFrameRef.current !== null) {
        window.cancelAnimationFrame(broadcastFrameRef.current);
        broadcastFrameRef.current = null;
      }
      pendingBroadcastRef.current = null;
      sendDrawing({
        strokeId: stroke.strokeId,
        points: finalizedStroke.points,
        color: finalizedStroke.color,
        width: finalizedStroke.width,
        tool: finalizedStroke.tool,
        isFinal: true,
      });
      endDrawing();
    }

    isPointerDownRef.current = false;
    activeStrokeRef.current = null;
    scheduleRedraw();
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

  const handleSaveSettings = () => {
    if (!settingsDraft || !isHost) return;
    updateRoomSettings(settingsDraft);
  };

  if (!currentRoom) return null;

  return (
    <div className="h-screen mx-auto grid max-w-6xl grid-cols-[1fr_380px]">
      <Card className="rounded-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">
            Room <span className="text-muted-foreground">{currentRoom.code}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={leaveRoom}>
              Leave
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentRoom.status === 'lobby' && isHost && settingsDraft ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Room settings</p>
                  <p className="text-xs text-muted-foreground">
                    Update before starting or before the next game.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSaveSettings}>
                  Save settings
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Players</span>
                  <Input
                    type="number"
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    value={settingsDraft.maxPlayers}
                    onChange={(e) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, maxPlayers: Number(e.target.value) } : current
                      )
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Rounds</span>
                  <Input
                    type="number"
                    min={MIN_ROUNDS}
                    max={MAX_ROUNDS}
                    value={settingsDraft.rounds}
                    onChange={(e) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, rounds: Number(e.target.value) } : current
                      )
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Draw time</span>
                  <Input
                    type="number"
                    min={MIN_DRAW_TIME}
                    max={MAX_DRAW_TIME}
                    value={settingsDraft.drawTime}
                    onChange={(e) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, drawTime: Number(e.target.value) } : current
                      )
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Word pack</span>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settingsDraft.wordPack}
                    onChange={(e) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, wordPack: e.target.value as WordPack } : current
                      )
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
            </div>
          ) : null}

          {gameState?.phase === 'choosing' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
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
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Round {gameState.currentRound}/{gameState.totalRounds}
                </span>
                {timeLeft > 0 ? <span>{formatTime(timeLeft)}</span> : null}
              </div>

              {isDrawer ? (
                <p className="text-sm text-muted-foreground">
                  Word: <span className="font-semibold text-foreground">{shownWord}</span>
                </p>
              ) : (
                <p className="text-center text-lg tracking-[0.25em] text-muted-foreground">
                  {gameState.hints.map((hint, index) => (
                    <span key={index}>{hint === '_' ? ' _ ' : hint}</span>
                  ))}
                </p>
              )}

              <div className="w-full aspect-[4/3] rounded-md border border-border bg-background overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full touch-none cursor-crosshair"
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={finishStroke}
                  onPointerCancel={finishStroke}
                  onLostPointerCapture={finishStroke}
                />
              </div>

              {isDrawer ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex border rounded-lg">
                    <Button
                      variant={selectedTool === 'pen' ? 'default' : 'ghost'}
                      onClick={() => setSelectedTool('pen')}
                    >
                      Pen
                    </Button>
                    <Button
                      variant={selectedTool === 'eraser' ? 'default' : 'ghost'}
                      onClick={() => setSelectedTool('eraser')}
                    >
                      Eraser
                    </Button>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex gap-1">
                    {CANVAS_COLORS.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`size-5 rounded-full border ${
                          selectedColor === color ? 'border-foreground' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex border rounded-lg">
                    {Object.entries(BRUSH_SIZES).map(([name, size]) => (
                      <Button
                        key={name}
                        variant={brushSize === size ? 'default' : 'ghost'}
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
            <p className="text-sm text-muted-foreground">
              Round over. {shownWord ? `Word: ${shownWord}` : ''}
            </p>
          ) : null}

          {currentRoom.status === 'lobby' ? (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button onClick={() => setReady(!isReady)} variant="outline">
                {isReady ? 'Unready' : 'Ready'}
              </Button>
              {currentRoom.host === playerId ? (
                <Button onClick={startGame} disabled={players.length < 2 || !allPlayersReady}>
                  {leaderboardVisible ? 'Start new game' : 'Start'}
                </Button>
              ) : null}
              {currentRoom.host === playerId && !allPlayersReady ? (
                <p className="w-full text-xs text-muted-foreground">
                  Waiting for every player to mark ready.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col">
        <Card className="rounded-none flex-1">
          <CardHeader>
            <CardTitle className="text-base">Players</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2 text-md">
                <span>
                  <img
                    className="size-4"
                    src={'https://emojicdn.elk.sh/' + AVATARS[player.avatarId]?.emoji || '😀'}
                  />
                </span>
                <span className="flex-1 truncate">
                  {player.nickname}
                  {player.nickname == nickname && ' (you)'}
                  {gameState?.currentDrawer === player.id ? '*' : ''}
                </span>
                {player.id === currentRoom.host ? <span>host</span> : null}
                <Badge variant="secondary" className="shrink-0">
                  {getPlayerScore(player.id)} pts
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {leaderboardVisible && leaderboard.length > 0 && (
          <Card className="flex-1 relative overflow-hidden rounded-none border-amber-200 bg-gradient-to-br from-amber-50 via-background to-background">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div key={celebrationToken} className="absolute inset-0">
                {confettiPieces.map((piece, index) => (
                  <span
                    key={`${celebrationToken}-${index}`}
                    className="absolute top-[-12%] rounded-sm confetti-piece"
                    style={{
                      left: piece.left,
                      width: `${piece.size}px`,
                      height: `${Math.max(8, Math.round(piece.size * 0.6))}px`,
                      animationDelay: piece.delay,
                      animationDuration: piece.duration,
                      backgroundColor: piece.backgroundColor,
                    }}
                  />
                ))}
              </div>
            </div>
            <CardHeader className="relative">
              <CardTitle className="text-base">Leaderboard (till now)</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-2 overflow-auto">
              {leaderboard.map((entry) => (
                <div
                  key={entry.playerId}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                    entry.rank === 1
                      ? 'border-amber-300 bg-amber-100/70'
                      : 'border-border bg-background'
                  }`}
                >
                  <span className="w-5 text-center font-semibold text-muted-foreground">
                    #{entry.rank}
                  </span>
                  <span className="flex-1 truncate font-medium">{entry.playerName}</span>
                  <Badge variant={entry.rank === 1 ? 'default' : 'outline'}>
                    {entry.score} pts
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-none flex-2">
          <CardHeader>
            <CardTitle className="text-base">Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 h-full flex flex-col">
            <div className="space-y-2 overflow-auto text-sm flex-1">
              {messages.map((msg) => (
                <div key={msg.id} className="text-foreground">
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
              />
              <Button onClick={isDrawer ? handleChat : handleGuess}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
