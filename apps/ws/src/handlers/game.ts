import type { Server, Socket } from 'socket.io';
import { EVENTS, GAME_PAUSE_DURATION } from '@draw/shared';
import type { RoomManager } from '../state/roomManager.js';
import type { GameEngine } from '../game/engine.js';
import { serializeRoom } from './connection.js';

export function setupGameHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
  gameEngine: GameEngine
) {
  socket.on(EVENTS.GAME_START, () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;
    if (room.host !== socket.id) {
      socket.emit(EVENTS.ERROR, { message: 'Only the host can start the game' });
      return;
    }
    if (room.players.size < 2) {
      socket.emit(EVENTS.ERROR, { message: 'Need at least 2 players' });
      return;
    }
    if (!Array.from(room.players.values()).every((player) => player.ready)) {
      socket.emit(EVENTS.ERROR, { message: 'All players must be ready before starting' });
      return;
    }

    const gameState = gameEngine.startGame(room);
    const choices = gameEngine.getWordChoices(room);

    io.to(room.id).emit(EVENTS.ROOM_STATE, serializeRoom(room));
    io.to(room.id).emit(EVENTS.GAME_ROUND_START, {
      drawer: gameState.currentDrawer,
      round: gameState.currentRound,
      totalRounds: gameState.totalRounds,
    });
    io.to(gameState.currentDrawer).emit(EVENTS.GAME_WORD_CHOICES, { words: choices });
  });

  socket.on(EVENTS.GAME_SELECT_WORD, (data: { word: string }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    if (room.game.currentDrawer !== socket.id) return;
    if (room.game.phase !== 'choosing') return;

    const gameState = gameEngine.selectWord(room, data.word, io);

    io.to(room.id).emit(EVENTS.GAME_ROUND_START, {
      drawer: gameState.currentDrawer,
      word: null,
      hints: gameState.hints,
      round: gameState.currentRound,
      totalRounds: gameState.totalRounds,
      drawTime: room.settings.drawTime,
    });

    io.to(room.id).emit(EVENTS.TIMER_TICK, { timeLeft: gameState.timer });
  });

  socket.on(EVENTS.GAME_GUESS, (data: { text: string }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    if (room.game.currentDrawer === socket.id) return;
    if (room.game.phase !== 'drawing') return;
    if (room.game.guessedPlayers.includes(socket.id)) return;

    const isCorrect = data.text.toLowerCase().trim() === room.game.currentWord.toLowerCase().trim();

    if (isCorrect) {
      const result = gameEngine.processGuess(room, socket.id, data.text);
      if (!result) return;

      io.to(room.id).emit(EVENTS.GAME_CORRECT_GUESS, {
        playerId: socket.id,
        playerName: room.players.get(socket.id)?.nickname,
        word: room.game.currentWord,
        points: result.points,
        guessedPlayers: room.game.guessedPlayers,
      });

      io.to(room.id).emit(EVENTS.ROOM_STATE, serializeRoom(room));

      if (gameEngine.allGuessed(room)) {
        handleRoundEnd(io, room, roomManager, gameEngine);
      }
    } else {
      io.to(room.id).emit(EVENTS.GAME_WRONG_GUESS, {
        playerId: socket.id,
        playerName: room.players.get(socket.id)?.nickname,
        text: data.text,
      });
    }
  });

  socket.on(EVENTS.GAME_DRAWING, (data: any) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    if (room.game.currentDrawer !== socket.id) return;

    socket.to(room.id).emit(EVENTS.GAME_DRAWING_DATA, {
      stroke: {
        ...data,
        id: Math.random().toString(36).slice(2),
        playerId: socket.id,
        timestamp: Date.now(),
      },
    });
  });

  socket.on(EVENTS.GAME_DRAWING_END, () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room || !room.game) return;

    if (room.game.phase === 'paused') {
      handleRoundEnd(io, room, roomManager, gameEngine);
    }
  });
}

function handleRoundEnd(io: Server, room: any, roomManager: RoomManager, gameEngine: GameEngine) {
  if (!room.game) return;

  gameEngine.clearTimer(room.id);

  const leaderboard = gameEngine.getLeaderboard(room);

  io.to(room.id).emit(EVENTS.GAME_ROUND_END, {
    word: room.game.currentWord,
    leaderboard,
  });

  setTimeout(() => {
    if (!room.game) return;

    const next = gameEngine.endRound(room);

    if (!next) {
      // Game over
      room.status = 'finished';
      io.to(room.id).emit(EVENTS.GAME_GAME_OVER, {
        leaderboard: gameEngine.getLeaderboard(room),
        stats: gameEngine.getGameStats(room),
      });
      io.to(room.id).emit(EVENTS.ROOM_STATE, serializeRoom(room));
      return;
    }

    const choices = gameEngine.getWordChoices(room);

    io.to(room.id).emit(EVENTS.GAME_ROUND_START, {
      drawer: next.nextDrawer,
      round: next.nextRound,
      totalRounds: room.game.totalRounds,
    });
    io.to(next.nextDrawer).emit(EVENTS.GAME_WORD_CHOICES, { words: choices });
  }, GAME_PAUSE_DURATION * 1000);
}
