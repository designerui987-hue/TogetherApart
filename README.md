# Together Apart 💖

A cozy, couple-friendly 3D browser-based cooperative adventure game built with **TypeScript**, **Three.js**, **Rapier 3D physics**, **Node.js**, and **Socket.IO**.

Inspired by the teamwork philosophy of *It Takes Two*, two players must communicate and combine their unique magical powers to traverse floating sky islands, solve cooperative puzzles, and unlock the ancient Heart Gate.

---

## 🌟 Highlights & Features

- **Mandatory Cooperation**: Every puzzle requires both players working together.
- **Two Unique Characters**:
  - ✨ **Lumi (The Light Weaver)**: Warm coral pink palette. Ability to conjure temporary glowing Starlight Platforms in mid-air (`Q`), allowing both players to cross wide chasms or gain vertical reach.
  - ⚡ **Nova (The Kinetic Shaper)**: Cool turquoise blue palette. Ability to emit Kinetic Pulse waves (`Q`) that activate ancient floating mechanisms and magnetic spires.
- **Couple-Friendly Mechanics**:
  - High-Five interaction (`E` key when standing close together) with celebratory sounds and heart bursts.
  - Generous platforming feel with **Coyote Time** (140ms grace period) and **Jump Buffering** (120ms buffer).
  - Safe, automatic checkpoint respawns (no permanent death, no penalties).
  - Encouraging toasts and shared milestone celebrations.
- **The Island of Connection (First Playable Level)**:
  - **Challenge 1: Trust Bridge**: One player holds down the pressure plate so their partner can cross, who then activates a crystal lever to lock the bridge open permanently.
  - **Challenge 2: Magical Crossing**: Lumi creates a temporary platform in mid-air so Nova can reach the floating spire and fire a kinetic pulse to awaken the moving platform.
  - **Challenge 3: Heart Gate**: Both players must activate their respective conduits within a 1.8-second synchronization window to unlock the final portal.
  - **Victory Summit**: Celebratory gazebo with fireworks, starlight sparkles, and heart bursts.
- **Zero Missing Assets**:
  - 100% procedural 3D models for Lumi, Nova, islands, bridges, crystals, clouds, and waterfalls using Three.js.
  - 100% procedural sound effects and ambient generative music using the native HTML5 **Web Audio API** (no missing sound files or 404s).
- **Online & Local Modes**:
  - **Online Co-Op**: Private 6-character room codes (`e.g. COZY88`), real-time 30Hz position/rotation synchronization with smooth client-side interpolation, and server-authoritative puzzle states.
  - **Local Shared-Screen Co-Op**: Two players on one keyboard with an intelligent dynamic framing camera that scales smoothly based on distance.

---

## 🎮 Controls

### Online Co-Op / Player 1 (Lumi)
| Action | Key / Input |
|---|---|
| **Move** | `W`, `A`, `S`, `D` |
| **Jump** | `Space` (Variable height, coyote time & jump buffering) |
| **Sprint** | `Shift` (1.5x speed boost) |
| **Interact / High-Five** | `E` (Click when prompt appears near partner or switches) |
| **Special Ability** | `Q` (Lumi: Starlight Platform / Nova: Kinetic Pulse) |
| **Look / Camera Orbit** | `Mouse` (Click canvas to lock cursor) |
| **Pause / Release Mouse** | `Esc` |

### Local Shared-Screen Mode (Player 2: Nova)
| Action | Key / Input |
|---|---|
| **Move** | `Arrow Keys` (Up, Left, Down, Right) |
| **Jump** | `Right Ctrl`, `Numpad 0`, or `/` |
| **Sprint** | `Right Shift` |
| **Interact / High-Five** | `Enter` or `L` |
| **Special Ability** | `K` or `Numpad 1` (Kinetic Pulse) |

---

## 🏗️ Architecture

The project is structured as an npm workspaces monorepo:

```
together-apart/
├── packages/
│   ├── shared/         # Shared TypeScript interfaces, network protocol & constants
│   │   ├── types.ts       # PlayerState, RoomState, PuzzleState, TransformState
│   │   ├── protocol.ts    # Socket.IO client-server event contracts
│   │   └── constants.ts   # Physics constants, cooldowns, checkpoints
│   ├── server/         # Node.js + Socket.IO Authoritative Server
│   │   ├── server.ts      # HTTP & Socket.IO server + static bundle host
│   │   ├── RoomManager.ts # 6-character room code management
│   │   ├── GameRoom.ts    # 30Hz sync tick loop & player pairing
│   │   └── PuzzleEngine.ts# Authoritative puzzle state machine
│   └── client/         # Vite + Three.js + Rapier 3D + UI
│       ├── core/          # Main GameApp loop
│       ├── physics/       # Rapier 3D world, colliders & raycasting
│       ├── graphics/      # Three.js scene, lighting, fog & particle system
│       ├── entities/      # Procedural CharacterModel, PlayerController, RemotePlayer
│       ├── camera/        # 3rd person orbit & dynamic co-op framing camera
│       ├── input/         # InputManager (keybindings & mouse look)
│       ├── level/         # IslandLevel procedural generator & puzzle meshes
│       ├── audio/         # SoundSynth Web Audio procedural synthesizer
│       ├── network/       # Socket.IO client & entity interpolation
│       ├── ui/            # UIManager for Menus, Lobby, HUD, Modals
│       ├── index.html     # Semantic UI layout
│       └── style.css      # Glassmorphism aesthetic & animations
├── test-multiplayer.mjs# Automated 12-stage end-to-end multiplayer verification
├── GAME_DESIGN.md      # Game Design Document
├── ARCHITECTURE.md     # Technical Architecture Document
└── TASKS.md            # Implementation Roadmap & Verification Checklist
```

---

## 🚀 Setup & Launch Instructions

### Prerequisites
- Node.js (v18 or higher recommended, tested on v24.15.0)
- npm (v9 or higher, tested on 11.12.1)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Start the Server & Play
Run the unified server (which hosts the authoritative Socket.IO backend and serves the compiled client):
```bash
npm start
```

Open your browser and navigate to:
```
http://localhost:3001
```

### 4. Playing Together (Online Co-Op)
1. Player 1 opens `http://localhost:3001`, clicks **Create Room**, enters their name (e.g., "Lumi"), and selects Lumi.
2. In the lobby, Player 1 clicks **Copy Room Code** (a 6-character code such as `COZY88`).
3. Player 2 opens `http://localhost:3001` in another browser tab or on another computer, clicks **Join Room**, enters the room code and their name, and joins.
4. Both players click **I'm Ready!**.
5. Once both players are ready, Player 1 clicks **Start Adventure**.

### 5. Playing Locally (Shared Keyboard Co-Op)
1. Open `http://localhost:3001`.
2. Click **Local Play (Shared Screen)**.
3. Player 1 controls Lumi with `W/A/S/D` and `Q/E/Space`.
4. Player 2 controls Nova with `Arrow Keys` and `K/L/Right Ctrl`.
5. The dynamic camera will automatically frame both players.

---

## 🧪 Testing & Verification

Run the comprehensive 12-stage automated multiplayer test suite:
```bash
node test-multiplayer.mjs
```

The test validates:
1. Real-time Socket.IO connection
2. Private 6-character room code generation
3. Client 2 joining the room
4. Character assignments (Lumi & Nova)
5. Lobby ready synchronization
6. Game start broadcast
7. 30 Hz player state synchronization
8. Challenge 1: Trust Bridge pressure plate and lever lock
9. Challenge 2: Magical Crossing platform and Nova kinetic pulse
10. Couple mechanic: High-Five proximity and particle event
11. Challenge 3: Heart Gate simultaneous switch synchronization
12. Level completion and victory celebration at the summit
