# Draw Simply Draw

A real-time multiplayer drawing and guessing game — a modern Scribble clone.

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: React 19 + Vite + TanStack Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Canvas**: perfect-freehand (smooth drawing)
- **State**: Zustand
- **API**: Hono on Node.js
- **WebSocket**: Socket.IO
- **Database**: In-memory (Map-based)

## Project Structure

```
draw-simply-draw/
├── apps/
│   ├── web/          # React frontend (port 5173)
│   ├── api/          # REST API (port 3000)
│   └── ws/           # WebSocket server (port 3001)
├── packages/
│   ├── shared/       # Types, constants, word bank
│   └── ui/           # Shared UI components
├── turbo.json
└── package.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start all dev servers
pnpm turbo dev

# Or start individually:
cd apps/web && pnpm dev     # http://localhost:5173
cd apps/api && pnpm dev     # http://localhost:3000
cd apps/ws  && pnpm dev     # http://localhost:3001
```

## How to Play

1. Enter your nickname and pick an avatar
2. Create a room or join with a room code
3. The drawer picks a word from 3 choices
4. Other players guess by typing in chat
5. Hints are revealed over time
6. Score points for correct guesses (faster = more points)
7. After all rounds, see the final leaderboard

## Features

- Real-time drawing with smooth strokes
- Word selection from categorized word packs
- Progressive hint system
- Scoring with speed bonuses
- Chat panel with guess validation
- Player avatars and nicknames
- Room creation and joining
- Turn-based rotation
- Leaderboard with rankings
