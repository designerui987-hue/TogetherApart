# Together Apart - Implementation Tasks & Roadmap

## Phase 1: Foundation & Project Workspace Setup
- [x] Create project design and architecture documentation (`GAME_DESIGN.md`, `ARCHITECTURE.md`, `TASKS.md`).
- [x] Initialize npm workspace (`package.json`, `packages/shared`, `packages/server`, `packages/client`).
- [x] Install compatible dependencies: Three.js, @dimforge/rapier3d-compat, socket.io, socket.io-client, express, vite, typescript.
- [x] Configure TypeScript configs and monorepo build scripts.

## Phase 2: Shared Types & Protocol
- [x] Implement `packages/shared/src/types.ts`:
  - `PlayerState`, `CharacterType` ('lumi' | 'nova'), `TransformState`, `InputFrame`.
  - `RoomState`, `RoomPlayer`, `PuzzleState`, `CheckpointState`.
- [x] Implement `packages/shared/src/protocol.ts`:
  - Socket.IO client-server events: `room:create`, `room:join`, `room:ready`, `game:start`, `player:update`, `player:ability`, `player:highfive`, `player:interact`, `player:checkpoint`, `player:respawn`.
- [x] Implement `packages/shared/src/constants.ts`: physics parameters, level coordinates, challenge IDs.

## Phase 3: Server Implementation
- [x] Set up Express + Socket.IO server in `packages/server`.
- [x] Implement `RoomManager` with 6-character room codes (e.g. `MK8ZLP`), 2-player capacity, lobby ready states.
- [x] Implement `GameRoom` managing the 30Hz network tick loop, player pairing, and disconnect handling.
- [x] Implement `PuzzleEngine`:
  - Challenge 1: Trust Bridge state machine (plate held -> bridge active -> lever activated -> locked).
  - Challenge 2: Magical Crossing state machine (platform active timer, moving platform position).
  - Challenge 3: Heart Gate dual-switch simultaneous timing window (1.8s tolerance).
  - Level completion tracking and broadcast.

## Phase 4: Client Graphics, Physics & Procedural Characters
- [x] Initialize Three.js WebGLRenderer, shadow maps, ambient/directional lighting, pastel fog, and skybox gradient.
- [x] Initialize Rapier 3D physics world with fixed timestep.
- [x] Procedural character generation:
  - Lumi: Warm coral/peach chibi character with bobbing floating wings, antenna light, procedural walk/jump cycle.
  - Nova: Cool turquoise/cyan chibi character with floating magnetic horns, procedural walk/jump cycle.
- [x] Procedural particle system for heart bursts, starlight platforms, and kinetic pulses.
- [x] Procedural Web Audio API sound synthesizer (jumps, steps, abilities, high-fives, victory chime, ambient music).

## Phase 5: Player Controller, Camera & Local/Online Input
- [x] Third-person camera controller with smooth follow, mouse orbit, and pitch clamping.
- [x] Responsive character kinematic physics with acceleration, coyote time, and jump buffering.
- [x] Dual-player local input support (Player 1 WASD + Q/E/Space, Player 2 Arrows + K/L/Ctrl) with dynamic framing camera.
- [x] Remote player entity interpolation (lerp position, slerp quaternion).
- [x] Ability implementation:
  - Lumi: Spawn 6-second Starlight Platform.
  - Nova: Kinetic Pulse wave activating crystals and platforms.

## Phase 6: First Level & Cooperative Puzzles
- [x] Procedural level generator: Floating sky islands with grass caps, rock underside, trees, flowers, crystals, waterfalls, and checkpoints.
- [x] Challenge 1: Trust Bridge with interactive pressure plate, visual rope bridge, and crystal locking lever.
- [x] Challenge 2: Magical Crossing with crystal conduit, moving floating platform, and gap requiring Lumi's platform.
- [x] Challenge 3: Heart Gate with twin glowing conduits, simultaneous activation switches, and opening door animation.
- [x] Victory summit with celebratory heart burst and stats.

## Phase 7: UI Menus, Lobby, HUD & Couple Interactions
- [x] Main Menu: Logo, Create Room, Join Room (with 6-character code input), Local Play, Settings, How to Play.
- [x] Multiplayer Lobby: Character selection, ready toggle, copy room code button, player status indicators.
- [x] In-game HUD: Character portrait, ability cooldown & icon, partner distance & direction indicator, high-five prompt (`[E] High-Five!`), shared checkpoint notification.
- [x] Pause menu and controls customization.
- [x] Victory screen overlay with replay / return to menu options.

## Phase 8: Testing, Verification & Launch Documentation
- [x] Run full build (`tsc`, Vite build) across all packages with zero errors.
- [x] Start unified server daemon on port 3001.
- [x] Conduct 12-stage automated multiplayer integration test verifying connection, puzzle solving, high-fives, and level completion.
- [x] Conduct dual-browser end-to-end testing with Puppeteer, verifying concurrent UI interaction and WebGL rendering.
- [x] Document complete setup and instructions in `README.md`.
