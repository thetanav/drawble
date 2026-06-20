import { create } from 'zustand';
import type { Player, Room, GameState, LeaderboardEntry, ChatMessage } from '@draw/shared';

interface PlayerState {
  id: string | null;
  nickname: string;
  avatarId: number;
  setPlayer: (id: string, nickname: string, avatarId: number) => void;
  setNickname: (nickname: string) => void;
  setAvatarId: (avatarId: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  id: null,
  nickname: '',
  avatarId: 0,
  setPlayer: (id, nickname, avatarId) => set({ id, nickname, avatarId }),
  setNickname: (nickname) => set({ nickname }),
  setAvatarId: (avatarId) => set({ avatarId }),
}));

interface RoomState {
  currentRoom: Room | null;
  setRoom: (room: Room | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  setRoom: (room) => set({ currentRoom: room }),
}));

interface GameStateStore {
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  wordChoices: string[];
  setWordChoices: (words: string[]) => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
}

export const useGameStore = create<GameStateStore>((set) => ({
  gameState: null,
  setGameState: (state) => set({ gameState: state }),
  wordChoices: [],
  setWordChoices: (words) => set({ wordChoices: words }),
  timeLeft: 0,
  setTimeLeft: (time) => set({ timeLeft: time }),
}));

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message].slice(-100),
    })),
  clearMessages: () => set({ messages: [] }),
}));

interface LeaderboardState {
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),
}));
