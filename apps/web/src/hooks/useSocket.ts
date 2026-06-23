import { useEffect, useRef, useCallback } from 'react';
import { EVENTS } from '@draw/shared';
import { usePlayerStore, useRoomStore, useGameStore, useChatStore, useLeaderboardStore } from '../stores';
import { getSocket, connectSocket } from '../lib/socket';

export function useSocket() {
  const socketRef = useRef(getSocket());
  const { nickname, avatarId, setPlayer } = usePlayerStore();
  const { setRoom } = useRoomStore();
  const { setGameState, setWordChoices, setTimeLeft } = useGameStore();
  const { addMessage } = useChatStore();
  const { setLeaderboard, showLeaderboard, hideLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    const socket = socketRef.current;

    socket.on(EVENTS.ROOM_STATE, (room: any) => {
      if (room) {
        const parsedRoom = {
          ...room,
          players: new Map(room.players.map((p: any) => [p.id, p])),
          game: room.game
            ? {
                ...room.game,
                scores: new Map(room.game.scores),
              }
            : null,
        };
        setRoom(parsedRoom);
        if (parsedRoom.game) {
          setGameState(parsedRoom.game);
        }
      } else {
        setRoom(null);
        setGameState(null);
      }
    });

    socket.on(EVENTS.GAME_WORD_CHOICES, (data: { words: string[] }) => {
      setWordChoices(data.words);
    });

    socket.on(EVENTS.GAME_HINT, (data: { hints: string[] }) => {
      useGameStore.setState((state) => ({
        gameState: state.gameState
          ? {
              ...state.gameState,
              hints: data.hints,
            }
          : state.gameState,
      }));
    });

    socket.on(EVENTS.GAME_ROUND_START, (data: any) => {
      hideLeaderboard();
      const currentWord = useGameStore.getState().gameState?.currentWord ?? '';
      setGameState({
        currentRound: data.round,
        totalRounds: data.totalRounds,
        currentDrawer: data.drawer,
        currentWord: data.word ?? currentWord,
        hints: data.hints || [],
        phase: data.hints ? 'drawing' : 'choosing',
        timer: data.drawTime || 80,
        scores: new Map(),
        drawingData: [],
        guessedPlayers: [],
      });
      setWordChoices([]);
    });

    socket.on(EVENTS.TIMER_TICK, (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on(EVENTS.GAME_CORRECT_GUESS, (data: any) => {
      addMessage({
        id: Math.random().toString(36).slice(2),
        playerId: data.playerId,
        playerName: data.playerName,
        text: `${data.playerName} guessed the word! +${data.points} pts`,
        type: 'correct',
        timestamp: Date.now(),
      });
    });

    socket.on(EVENTS.GAME_WRONG_GUESS, (data: any) => {
      addMessage({
        id: Math.random().toString(36).slice(2),
        playerId: data.playerId,
        playerName: data.playerName,
        text: data.text,
        type: 'guess',
        timestamp: Date.now(),
      });
    });

    socket.on(EVENTS.GAME_ROUND_END, (data: any) => {
      setLeaderboard(data.leaderboard);
      showLeaderboard();
    });

    socket.on(EVENTS.GAME_GAME_OVER, (data: any) => {
      setLeaderboard(data.leaderboard);
      showLeaderboard();
    });

    socket.on(EVENTS.CHAT_MESSAGE, (message: any) => {
      addMessage(message);
    });

    socket.on(EVENTS.ERROR, (data: { message: string }) => {
      console.error('Server error:', data.message);
    });

    return () => {
      socket.off(EVENTS.ROOM_STATE);
      socket.off(EVENTS.GAME_WORD_CHOICES);
      socket.off(EVENTS.GAME_HINT);
      socket.off(EVENTS.GAME_ROUND_START);
      socket.off(EVENTS.TIMER_TICK);
      socket.off(EVENTS.GAME_CORRECT_GUESS);
      socket.off(EVENTS.GAME_WRONG_GUESS);
      socket.off(EVENTS.GAME_ROUND_END);
      socket.off(EVENTS.GAME_GAME_OVER);
      socket.off(EVENTS.CHAT_MESSAGE);
      socket.off(EVENTS.ERROR);
    };
  }, []);

  const joinSocket = useCallback(() => {
    const socket = socketRef.current;
    const announcePlayer = () => {
      if (!socket.id) return;
      setPlayer(socket.id, nickname, avatarId);
      socket.emit(EVENTS.PLAYER_JOIN, { nickname, avatarId });
    };

    if (socket.connected) {
      announcePlayer();
      return;
    }

    socket.once('connect', announcePlayer);
    connectSocket();
  }, [nickname, avatarId, setPlayer]);

  const createRoom = useCallback(
    (settings?: any) => {
      const socket = socketRef.current;
      socket.emit(EVENTS.ROOM_CREATE, { nickname, avatarId, settings });
    },
    [nickname, avatarId]
  );

  const joinRoom = useCallback(
    (roomCode: string) => {
      const socket = socketRef.current;
      socket.emit(EVENTS.ROOM_JOIN, { roomCode, nickname, avatarId });
    },
    [nickname, avatarId]
  );

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    socket.emit(EVENTS.ROOM_LEAVE);
  }, []);

  const startGame = useCallback(() => {
    const socket = socketRef.current;
    socket.emit(EVENTS.GAME_START);
  }, []);

  const selectWord = useCallback((word: string) => {
    const socket = socketRef.current;
    socket.emit(EVENTS.GAME_SELECT_WORD, { word });
  }, []);

  const sendGuess = useCallback((text: string) => {
    const socket = socketRef.current;
    socket.emit(EVENTS.GAME_GUESS, { text });
  }, []);

  const sendDrawing = useCallback((data: any) => {
    const socket = socketRef.current;
    socket.emit(EVENTS.GAME_DRAWING, data);
  }, []);

  const endDrawing = useCallback(() => {
    const socket = socketRef.current;
    socket.emit(EVENTS.GAME_DRAWING_END);
  }, []);

  const sendChat = useCallback((text: string) => {
    const socket = socketRef.current;
    socket.emit(EVENTS.CHAT_SEND, { text });
  }, []);

  const setReady = useCallback((ready: boolean) => {
    const socket = socketRef.current;
    socket.emit(EVENTS.PLAYER_READY, { ready });
  }, []);

  const requestRoomList = useCallback(() => {
    const socket = socketRef.current;
    socket.emit(EVENTS.ROOM_LIST);
  }, []);

  return {
    socket: socketRef.current,
    joinSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    selectWord,
    sendGuess,
    sendDrawing,
    endDrawing,
    sendChat,
    setReady,
    requestRoomList,
  };
}
