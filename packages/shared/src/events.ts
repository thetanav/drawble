export const EVENTS = {
  // Player events
  PLAYER_JOIN: 'player:join',
  PLAYER_UPDATE: 'player:update',
  PLAYER_READY: 'player:ready',

  // Room events
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE: 'room:state',
  ROOM_LIST: 'room:list',
  ROOM_LIST_UPDATE: 'room:list:update',

  // Game events
  GAME_START: 'game:start',
  GAME_WORD_CHOICES: 'game:word-choices',
  GAME_SELECT_WORD: 'game:select-word',
  GAME_ROUND_START: 'game:round-start',
  GAME_HINT: 'game:hint',
  GAME_DRAWING: 'game:drawing',
  GAME_DRAWING_DATA: 'game:drawing-data',
  GAME_DRAWING_END: 'game:drawing-end',
  GAME_GUESS: 'game:guess',
  GAME_CORRECT_GUESS: 'game:correct-guess',
  GAME_WRONG_GUESS: 'game:wrong-guess',
  GAME_ROUND_END: 'game:round-end',
  GAME_GAME_OVER: 'game:game-over',

  // Chat events
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',

  // Timer events
  TIMER_TICK: 'timer:tick',

  // Error
  ERROR: 'error',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
