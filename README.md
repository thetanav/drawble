<div align="center">
  <h1>Drawble</h1>
  <p><strong>A real-time multiplayer drawing and guessing game</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Turborepo-2-EF4444?logo=turborepo" alt="Turborepo" />
    <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  </p>
</div>

---

A modern Scribble.io clone built with a monorepo architecture. Players join rooms, take turns drawing words from categorized packs, and race to guess correctly. Points are awarded for speed, with progressive hints and a live leaderboard.

---

## ✨ Features

| Feature | Detail |
|---|---|
| **Real-time Drawing** | Smooth, pressure-sensitive strokes powered by `perfect-freehand` |
| **Canvas Tools** | Pen & eraser with 3 brush sizes and 12 colors |
| **Word Packs** | 6 categories: General, Food, Animals, Objects, Nature, and Custom |
| **Word Selection** | Drawer picks from 3 random words in their chosen pack |
| **Progressive Hints** | Letters auto-reveal over time (up to 2 hints per round) |
| **Scoring System** | Speed-based scoring with hint penalties and drawer bonuses |
| **Configurable Rooms** | Custom round count (2–15), round timer (30–180s), max players (2–12) |
| **Player Ready System** | All players must ready up before the game starts |
| **Chat & Guessing** | General chat + guess input with validation against the target word |
| **Leaderboard** | Live scoreboard with confetti animation on round/game end |
| **12 Avatars** | Emoji-based avatars for player identity |
| **Dark Mode** | Dark/light/system theme support |

---

## 📷 Screenshots

> *Screenshots coming soon. Replace these placeholders with your own images.*

| Home Page | Game Room |
|:---:|:---:|
| ![Home Page](https://via.placeholder.com/400x250?text=Home+Page) | ![Game Room](https://via.placeholder.com/400x250?text=Game+Room) |
| **Lobby** | **Drawing Canvas** |
| ![Lobby](https://via.placeholder.com/400x250?text=Lobby) | ![Canvas](https://via.placeholder.com/400x250?text=Drawing+Canvas) |

---

## 🏗️ Architecture

The app follows a **3-tier monorepo architecture** using Turborepo + pnpm workspaces:

<img width="1017" height="674" alt="image" src="https://github.com/user-attachments/assets/0dafa0d7-21d9-4e32-8dd7-bc06b68df81a" />

| Layer | Description |
|---|---|
| **Web Client** (`apps/web`) | React SPA with TanStack Router. Zustand for client state. Canvas rendered with HTML5 Canvas + perfect-freehand. |
| **REST API** (`apps/api`) | Lightweight Hono server serving word bank and avatar endpoints. |
| **Socket Server** (`apps/socket`) | Core game logic — rooms, turn rotation, drawing broadcast, hints, scoring, chat. Houses `GameEngine` and `RoomManager`. |
| **Shared Package** (`packages/shared`) | Pure TypeScript library with types, event constants, game constants, and the word bank. Consumed by all three apps. |

---

## 🗂️ Project Structure

```
draw-simply-draw/
├── apps/
│   ├── web/                  # React frontend (port 5173)
│   │   ├── src/
│   │   │   ├── components/   # UI components (button, card, input, badge)
│   │   │   ├── hooks/        # useSocket — Socket.IO event bindings
│   │   │   ├── lib/          # canvas.ts, socket.ts, utils.ts
│   │   │   ├── stores/       # Zustand stores (Player, Room, Game, Chat, Leaderboard)
│   │   │   └── routes/       # TanStack Router routes (home, lobby, room)
│   │   └── public/
│   ├── api/                  # Hono REST API (port 3000)
│   │   └── src/routes/       # Word endpoints (GET /api/words/:pack, etc.)
│   └── socket/               # Socket.IO game server (port 3001)
│       └── src/
│           ├── handlers/     # connection, room, game, chat handlers
│           ├── game/         # GameEngine — timer, hints, scoring, rounds
│           └── state/        # RoomManager — in-memory room state
├── packages/
│   └── shared/               # Types, events, constants, word bank
├── turbo.json                # Turborepo pipeline configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **pnpm** 9.15.0+

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/thetanav/draw-simply-draw.git
cd draw-simply-draw

# Install dependencies
pnpm install

# Start all dev servers simultaneously (via Turborepo)
pnpm turbo dev

# Or start each service individually:
cd apps/web && pnpm dev      # http://localhost:5173
cd apps/api && pnpm dev      # http://localhost:3000
cd apps/socket && pnpm dev   # http://localhost:3001
```

> The web client expects the API at `http://localhost:3000` and the Socket.IO server at `http://localhost:3001`. You can configure these via `apps/web/.env`.

---

## 🎮 How to Play

1. **Enter your nickname** and choose from 12 emoji-based avatars
2. **Create a room** (or join one with a 6-character room code)
3. Configure **room settings** (rounds, timer, max players) in the lobby
4. **Ready up** — the game starts when all players are ready
5. **The drawer** picks a word from 3 random choices in a selected category
6. **Draw** on the canvas while other players guess in chat
7. **Hints** automatically reveal as time passes
8. **Score points** for correct guesses (faster = more points)
9. **Rounds rotate** — each player gets a turn to draw
10. **Final leaderboard** crowns the winner with a confetti celebration

### Scoring

| Action | Points |
|---|---|
| 1st correct guess | 300 |
| 2nd correct guess | 200 |
| 3rd+ correct guess | 100 |
| Speed bonus | Up to +100 (based on remaining time) |
| Hint penalty | −25% per hint used |
| Drawer bonus | +150 if at least one player guesses correctly |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Monorepo** | Turborepo 2.9 + pnpm workspaces |
| **Frontend** | React 19, Vite 6, TanStack Router 1.120 |
| **Styling** | Tailwind CSS 4, shadcn/ui, Geist Variable font |
| **Canvas** | perfect-freehand 1.2 |
| **State** | Zustand 5 |
| **Backend** | Hono 4.7 (Node.js via @hono/node-server) |
| **WebSocket** | Socket.IO 4.8 (server + client) |
| **Data** | In-memory (Map-based) |
| **Linting** | oxlint 1.71 |
| **Formatting** | Prettier 3.8 |
| **Icons** | Tabler Icons React, Lucide React |
| **ID Gen** | nanoid 5.1 |
| **Validation** | Zod 3.25 |
| **Type Safety** | TypeScript 5.9 |

---

## 🧪 Code Quality

- **Linting:** oxlint — run with `pnpm lint` (also runs as a Husky pre-commit hook)
- **Formatting:** Prettier — run with `pnpm format`
- **Clean:** Remove all build artifacts with `pnpm turbo clean`

---

## 🗺️ Roadmap

- [ ] Persistent storage for rooms/scores (SQLite or Postgres)
- [ ] YouTube music autoplay in rooms (admin shares a URL, everyone hears it)
- [ ] Custom word submissions
- [ ] Spectator mode
- [ ] Round replay (playback of the drawing)
- [ ] Mobile-responsive canvas

---

## 📄 License

This project is for personal/portfolio use.
