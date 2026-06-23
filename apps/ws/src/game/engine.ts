import type { GameState, Room, LeaderboardEntry, GameStats } from '@draw/shared';
import { POINTS, HINT_INTERVAL_SECONDS, GAME_PAUSE_DURATION } from '@draw/shared';
import { getRandomWords } from '@draw/shared';
import { nanoid } from 'nanoid';

export class GameEngine {
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private hintTimers = new Map<string, ReturnType<typeof setInterval>>();

  startGame(room: Room): GameState {
    const playerIds = Array.from(room.players.keys());
    const firstDrawer = playerIds[0];

    const gameState: GameState = {
      currentRound: 1,
      totalRounds: room.settings.rounds,
      currentDrawer: firstDrawer,
      currentWord: '',
      hints: [],
      phase: 'choosing',
      timer: room.settings.drawTime,
      scores: new Map(playerIds.map((id) => [id, 0])),
      drawingData: [],
      guessedPlayers: [],
    };

    room.game = gameState;
    room.status = 'playing';

    return gameState;
  }

  selectWord(room: Room, word: string): GameState {
    if (!room.game) throw new Error('Game not started');
    room.game.currentWord = word;
    room.game.phase = 'drawing';
    room.game.hints = this.createHints(word);
    room.game.timer = room.settings.drawTime;
    room.game.guessedPlayers = [];

    this.startTimer(room);
    this.startHintTimer(room);

    return room.game;
  }

  private createHints(word: string): string[] {
    return word.split('').map((char) => (char === ' ' ? ' ' : '_'));
  }

  private startHintTimer(room: Room): void {
    // timer for user to select a word to draw
    this.clearHintTimer(room.id);

    let hintIndex = 0;
    const word = room.game!.currentWord;
    const revealableIndices: number[] = [];

    word.split('').forEach((char, i) => {
      if (char !== ' ') revealableIndices.push(i);
    });

    // Shuffle reveal order
    for (let i = revealableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [revealableIndices[i], revealableIndices[j]] = [revealableIndices[j], revealableIndices[i]];
    }

    const maxHints = Math.min(
      revealableIndices.length,
      Math.floor(room.settings.drawTime / HINT_INTERVAL_SECONDS)
    );

    const timer = setInterval(() => {
      if (!room.game || room.game.phase !== 'drawing') {
        this.clearHintTimer(room.id);
        return;
      }

      if (hintIndex >= maxHints) {
        this.clearHintTimer(room.id);
        return;
      }

      const idx = revealableIndices[hintIndex];
      room.game.hints[idx] = word[idx];
      hintIndex++;
    }, HINT_INTERVAL_SECONDS * 1000);

    this.hintTimers.set(room.id, timer);
  }

  private startTimer(room: Room): void {
    // timer for other to guess
    this.clearTimer(room.id);

    const timer = setInterval(() => {
      if (!room.game || room.game.phase !== 'drawing') {
        this.clearTimer(room.id);
        return;
      }

      room.game.timer--;

      if (room.game.timer <= 0) {
        this.clearTimer(room.id);
        this.clearHintTimer(room.id);
        room.game.phase = 'paused';
      }
    }, 1000);

    this.timers.set(room.id, timer);
  }

  clearTimer(roomId: string): void {
    const timer = this.timers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomId);
    }
  }

  clearHintTimer(roomId: string): void {
    const timer = this.hintTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.hintTimers.delete(roomId);
    }
  }

  processGuess(
    room: Room,
    playerId: string,
    guess: string
  ): { correct: boolean; points: number } | null {
    // will be the actual guess processing logic
    if (!room.game || room.game.phase !== 'drawing' || room.game.guessedPlayers.includes(playerId))
      return null;

    const word = room.game.currentWord.toLowerCase();
    // const guess = room.game.currentWord.toLowerCase();

    if (word !== guess) return null; // guess is incorrect: just ignore

    room.game.guessedPlayers.push(playerId);

    const guessCount = room.game.guessedPlayers.length;
    let guessPoints = 0;

    // Calculate guess points based on guess count

    if (guessCount === 1) guessPoints = POINTS.FIRST_GUESS;
    else if (guessCount === 2) guessPoints = POINTS.SECOND_GUESS;
    else guessPoints = POINTS.THIRD_PLUS_GUESS;

    // Speed bonus
    const timeRatio = room.game.timer / room.settings.drawTime;
    const speedBonus = Math.floor(timeRatio * POINTS.SPEED_BONUS_MAX);

    // Hint penalty
    const hintsRevealed = room.game.hints.filter((h) => h !== '_').length;
    const hintPenalty = (hintsRevealed * POINTS.HINT_PENALTY_PERCENT) / 100;
    const finalPoints = Math.max(0, Math.floor((guessPoints + speedBonus) * (1 - hintPenalty)));

    const currentScore = room.game.scores.get(playerId) || 0;
    room.game.scores.set(playerId, currentScore + finalPoints);

    // Drawer gets bonus if someone guessed for the first quess only
    if (guessCount == 1) {
      const drawerScore = room.game.scores.get(room.game.currentDrawer) || 0;
      room.game.scores.set(room.game.currentDrawer, drawerScore + POINTS.DRAWER_BONUS);
    }

    // TODO: Now we have to reveal the hints

    return { correct: true, points: finalPoints };
  }

  allGuessed(room: Room): boolean {
    if (!room.game) return false;
    const nonDrawerPlayers = Array.from(room.players.keys()).filter(
      (id) => id !== room.game!.currentDrawer
    );
    return nonDrawerPlayers.every((id) => room.game!.guessedPlayers.includes(id));
  }

  endRound(room: Room): { nextDrawer: string; nextRound: number } | null {
    // this function auto increments the rounds and cycles through players
    if (!room.game) return null;

    this.clearTimer(room.id);
    this.clearHintTimer(room.id);

    const playerIds = Array.from(room.players.keys());
    const currentDrawerIndex = playerIds.indexOf(room.game.currentDrawer);

    let nextDrawerIndex = (currentDrawerIndex + 1) % playerIds.length;
    let nextRound = room.game.currentRound;

    // If we've gone through all players, increment round
    if (nextDrawerIndex === 0) {
      nextRound = room.game.currentRound + 1;
    }

    if (nextRound > room.game.totalRounds) {
      return null; // Game over
    }

    room.game.currentRound = nextRound;
    room.game.currentDrawer = playerIds[nextDrawerIndex];
    room.game.phase = 'choosing';
    room.game.hints = [];
    room.game.drawingData = [];
    room.game.guessedPlayers = [];
    room.game.timer = room.settings.drawTime;

    return { nextDrawer: playerIds[nextDrawerIndex], nextRound };
  }

  getLeaderboard(room: Room): LeaderboardEntry[] {
    if (!room.game) return [];

    const entries: LeaderboardEntry[] = Array.from(room.players.entries()).map(([id, player]) => ({
      playerId: id,
      playerName: player.nickname,
      score: room.game!.scores.get(id) || 0,
      rank: 0,
      correctGuesses: room.game!.guessedPlayers.filter((gId) => gId === id).length,
      avgGuessTime: 0,
      drawingsCompleted: 0,
    }));

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });

    return entries;
  }

  getGameStats(room: Room): GameStats {
    return {
      fastestGuess: null,
      bestDrawer: null,
      totalWordsGuessed: room.game?.guessedPlayers.length || 0,
      avgGuessTime: 0,
    };
  }

  getWordChoices(room: Room): string[] {
    if (!room.game) return [];
    return getRandomWords(room.settings.wordPack, 3, []);
  }
}
