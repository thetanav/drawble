export const DEFAULT_ROOM_SETTINGS = {
  maxPlayers: 6,
  rounds: 5,
  drawTime: 80,
  wordPack: 'general' as const,
};

export const MIN_PLAYERS_TO_START = 2;
export const MAX_ROUNDS = 15;
export const MIN_ROUNDS = 2;
export const MAX_DRAW_TIME = 180;
export const MIN_DRAW_TIME = 30;
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS = 2;

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const HINT_INTERVAL_SECONDS = 15;
export const HINT_REVEAL_COUNT = 2;

export const POINTS = {
  FIRST_GUESS: 300,
  SECOND_GUESS: 200,
  THIRD_PLUS_GUESS: 100,
  DRAWER_BONUS: 150,
  SPEED_BONUS_MAX: 100,
  HINT_PENALTY_PERCENT: 25,
} as const;

export const GAME_PAUSE_DURATION = 5;

export const AVATARS = [
  { id: 0, emoji: '😀', name: 'Happy' },
  { id: 1, emoji: '😎', name: 'Cool' },
  { id: 2, emoji: '🤖', name: 'Robot' },
  { id: 3, emoji: '👻', name: 'Ghost' },
  { id: 4, emoji: '🐱', name: 'Cat' },
  { id: 5, emoji: '🐶', name: 'Dog' },
  { id: 6, emoji: '🦊', name: 'Fox' },
  { id: 7, emoji: '🐸', name: 'Frog' },
  { id: 8, emoji: '🦁', name: 'Lion' },
  { id: 9, emoji: '🐼', name: 'Panda' },
  { id: 10, emoji: '🦄', name: 'Unicorn' },
  { id: 11, emoji: '🐙', name: 'Octopus' },
] as const;

export const CANVAS_COLORS = [
  '#000000', '#8B4513', '#0000FF', '#008000',
  '#FFD700', '#FF8C00', '#FF0000', '#FFFFFF',
  '#FF69B4', '#800080', '#00CED1', '#FF6347',
];

export const BRUSH_SIZES = {
  small: 3,
  medium: 6,
  large: 12,
} as const;
