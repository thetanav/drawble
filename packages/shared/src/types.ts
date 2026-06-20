export interface Player {
  id: string;
  nickname: string;
  avatarId: number;
  ready: boolean;
  connected: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordPack: WordPack;
}

export interface Room {
  id: string;
  code: string;
  host: string;
  settings: RoomSettings;
  players: Map<string, Player>;
  status: 'lobby' | 'playing' | 'finished';
  game: GameState | null;
}

export interface GameState {
  currentRound: number;
  totalRounds: number;
  currentDrawer: string;
  currentWord: string;
  hints: string[];
  phase: 'choosing' | 'drawing' | 'paused' | 'roundEnd';
  timer: number;
  scores: Map<string, number>;
  drawingData: DrawingStroke[];
  guessedPlayers: string[];
}

export interface DrawingStroke {
  id: string;
  playerId: string;
  tool: 'pen' | 'eraser' | 'fill' | 'line';
  points: { x: number; y: number }[];
  color: string;
  width: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'guess' | 'correct' | 'system' | 'chat';
  timestamp: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  correctGuesses: number;
  avgGuessTime: number;
  drawingsCompleted: number;
}

export interface GameStats {
  fastestGuess: { playerId: string; playerName: string; time: number } | null;
  bestDrawer: { playerId: string; playerName: string; avgGuesses: number } | null;
  totalWordsGuessed: number;
  avgGuessTime: number;
}

export type WordPack = 'general' | 'food' | 'animals' | 'objects' | 'nature' | 'custom';

export interface RoomListItem {
  id: string;
  code: string;
  host: string;
  playerCount: number;
  maxPlayers: number;
  status: Room['status'];
  settings: Pick<RoomSettings, 'rounds' | 'drawTime'>;
}
