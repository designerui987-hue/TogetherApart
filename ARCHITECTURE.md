# Together Apart - Architecture Specification

## 1. System Overview
Together Apart is structured as a high-performance, real-time client-server architecture with shared TypeScript types and protocol definitions.

```
together-apart/
├── packages/
│   ├── shared/         # Common TypeScript types, protocol, constants, and math
│   │   ├── src/
│   │   │   ├── types.ts       # PlayerState, RoomState, PuzzleState, InputFrame
│   │   │   ├── protocol.ts    # Socket.IO event contracts
│   │   │   └── constants.ts   # Movement speeds, physics values, puzzle IDs
│   │   └── package.json
│   ├── server/         # Node.js + Socket.IO Authoritative Room Server
│   │   ├── src/
│   │   │   ├── server.ts      # HTTP & Socket.IO server initialization
│   │   │   ├── RoomManager.ts # Room creation, lobby pairing, codes (e.g. "COZY01")
│   │   │   ├── GameRoom.ts    # Room instance state, puzzle arbitration, sync loop
│   │   │   └── PuzzleEngine.ts# Authoritative puzzle state machine
│   │   └── package.json
│   └── client/         # Vite + Three.js + Rapier + HTML/CSS UI
│       ├── src/
│       │   ├── core/          # Game loop, Engine, Clock
│       │   ├── physics/       # Rapier physics world & character controllers
│       │   ├── graphics/      # Three.js scene, lighting, materials, particles
│       │   ├── entities/      # Character procedural geometry, animations, abilities
│       │   ├── camera/        # 3rd person follow camera + dynamic co-op framing
│       │   ├── input/         # Keyboard & mouse managers, keybinding maps
│       │   ├── network/       # Socket.IO client, interpolation, entity sync
│       │   ├── level/         # Procedural islands, foliage, bridges, crystals
│       │   ├── puzzles/       # Client-side puzzle interaction and visual feedback
│       │   ├── audio/         # Procedural Web Audio API sound generator
│       │   └── ui/            # Main menu, lobby, HUD, settings, high-five prompt
│       ├── index.html
│       ├── style.css
│       └── package.json
├── package.json        # Root workspace configuration
├── tsconfig.json       # Monorepo TypeScript configuration
└── README.md
```

## 2. Network Topology & State Synchronization

### 2.1 State Authority Model
- **Player Movement**: Client-side authoritative position/rotation with server relay and remote entity interpolation (linear interpolation for position + spherical interpolation for rotation) to achieve zero latency for local player input.
- **Puzzle State**: **Strictly Server-Authoritative**. When a player activates a pressure plate, casts a pulse on a mechanism, or triggers a Heart Gate switch, the event is verified and evaluated by the server. The server broadcasts the resulting synchronized puzzle state to both clients.
- **Checkpoints & Respawns**: Server coordinates safe checkpoint progress. When a player falls off an island into the void (Y < -15), the client automatically respawns the player at the last reached shared checkpoint.

### 2.2 Tick Rate & Packet Frequency
- **Client Render Loop**: 60 FPS (RequestAnimationFrame).
- **Physics Step**: Fixed timestep at 60 Hz (Rapier).
- **Network Broadcast Rate**: 30 Hz for continuous player transforms; immediate event push for discrete state changes (abilities, puzzle activations, high-fives).
- **Interpolation Buffer**: 100ms jitter buffer on the client for smooth remote character rendering.

## 3. Physics & Movement Foundation (Rapier 3D)
- Rapier 3D compatibility build (`@dimforge/rapier3d-compat`).
- Kinematic / Dynamic character controller with:
  - Responsive acceleration ($30 m/s^2$) and damping friction.
  - Coyote time (120ms grace period after stepping off an edge).
  - Jump buffering (100ms window where a jump press before landing is honored).
  - Capsule collider with raycasting ground check.
  - Floating island static trimesh / box colliders.

## 4. Procedural Visual & Audio Systems
- **Three.js Custom Procedural Models**:
  - Lumi: Round chibi humanoid mesh, glowing floating halo, fairy wings, soft coral-pink emissive shaders.
  - Nova: Sleek robotic chibi humanoid mesh, floating crystal horns, cyan-mint emissive accents.
- **Procedural Audio (Web Audio API)**:
  - Zero external `.mp3` / `.wav` assets.
  - Custom procedural oscillators (Sine, Triangle, Sawtooth) with ADSR envelope generator, biquad filter sweeps, and algorithmic reverb / chorus.
- **Shader & Particle Effects**:
  - Procedural billowy clouds using soft particle meshes.
  - Heart particle bursts with quadratic bezier trajectories.
  - Luminous starlight platform shimmer.
  - Dynamic waterfalls with animated UV foam strips.

## 5. UI & HUD Architecture
- Standard semantic HTML5 / modern CSS overlaid on the WebGL canvas.
- Glassmorphism aesthetic with subtle backdrop filters, glowing pastel borders, and smooth transitions.
- Fully responsive across desktop screen sizes.
