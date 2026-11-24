# Together Apart — Implementation Tasks & Roadmap

## Phase 1: Foundation & Gameplay Prototype
- [x] Create project design and architecture documentation (`GAME_DESIGN.md`, `ARCHITECTURE.md`, `TASKS.md`).
- [x] Initialize npm workspace (`package.json`, `packages/shared`, `packages/server`, `packages/client`).
- [x] Install dependencies: Three.js, @dimforge/rapier3d-compat, socket.io, socket.io-client, express, vite, typescript.
- [x] Shared Types & Protocol (`PlayerState`, `RoomState`, `PuzzleState`, `TransformState`, `ClientToServerEvents`).
- [x] Server Implementation (`RoomManager`, `GameRoom`, `PuzzleEngine`).
- [x] Client Foundation (Three.js WebGL, Rapier 3D physics, SoundSynth procedural audio).
- [x] Character controllers, coyote time, jump buffering, online and local shared keyboard inputs.
- [x] Level 1: The Island of Connection (3 cooperative challenges: Trust Bridge, Magical Crossing, Heart Gate).
- [x] Main Menu, Lobby, In-Game HUD, Victory Modal.
- [x] 12-stage automated multiplayer test suite.

---

## Phase 2: Premium Visual Overhaul
- [x] Create and checkout git branch `phase-2-visual-overhaul`.
- [x] Capture and archive prototype baseline screenshots to `screenshots/baseline/`.
- [x] Author `VISUAL_DESIGN.md`, `VISUAL_UPGRADE_TASKS.md`, and `ASSET_LICENSES.md`.
- [x] Upgrade Rendering Engine (`SceneManager.ts`):
  - [x] Three.js `EffectComposer` pipeline with `RenderPass`, `UnrealBloomPass`, and custom `VignetteColorGradeShader`.
  - [x] sRGB linear color management, ACESFilmicToneMapping, calibrated exposure ($1.15$).
  - [x] Warm directional sunlight, soft PCF shadows, and lavender ground bounce fill.
  - [x] Procedural celestial gradient sky dome (peach horizon to mystical lavender and azure).
  - [x] Layered fluffy drifting clouds.
  - [x] Quality presets: Low, Medium, High, Ultra with runtime switching.
- [x] Sculpt Concept-Matched Character Models (`CharacterModel.ts`):
  - [x] **Lumi**: Animated expressive anime eyes, blinking eyelids, soft coral hair with bangs & curls, layered fairy dress with scalloped frills and brooch, glowing translucent butterfly wings with flutter, flowing silk scarf with wave physics.
  - [x] **Nova**: Elven pointed ears, golden skin tone, cyan iris spark, sweeping crest hair, winged golden headpiece with amber gem, adventurer teal tunic with brass buckle belt, oversized kinetic gauntlets, and orbiting satellite crystal gyro rings.
  - [x] Universal Animation State Machine: idle breathing, blinking, walk, sprint, jump anticipation, apex glide, falling, landing squash & stretch recovery, turning bank lean, ability casts, high-five, and victory celebration.
- [x] Environment Overhaul (`IslandLevel.ts`):
  - [x] Organic irregular islands with layered rock strata, overhanging grass lips, and moss edges.
  - [x] Instanced wildflowers (coral, yellow, turquoise, white daisies) and grass tufts.
  - [x] Stylized multi-tiered cloud canopy trees with wind sway.
  - [x] Bioluminescent fairy mushroom clusters and glowing crystals.
  - [x] Animated waterfalls with scrolling foam and mist particles.
  - [x] Distant floating islands in depth parallax, drifting fireflies, and animated fluttering butterflies.
- [x] Puzzle Visual Redesign & Visual Effects (`IslandLevel.ts`, `ParticleSystem.ts`):
  - [x] Weathered timber Trust Bridge with rope posts, brass spiral pressure plate, and crystal gear lever.
  - [x] Prismatic iridescent Starlight Platform with perimeter rune dial; Nova kinetic obelisk with spinning gyroscope rings.
  - [x] Grand stone Heart Gate archway with intertwined heart motif, engraved runes, glowing coral & turquoise ground conduits, and sliding doors.
  - [x] Pooled particle system for jump dust, landing dust puffs, sprint trails, high-five heart fireworks, and victory celebration.
- [x] Camera, Game Feel & HUD/UI Polish (`CameraController.ts`, `UIManager.ts`, `style.css`):
  - [x] Camera sprint FOV expansion, ground collision clamping, and living 3D menu showcase orbit.
  - [x] Glassmorphism UI 2.0 with iridescent border highlights.
  - [x] Graphics Quality selector (Low / Medium / High / Ultra), Reduced Motion toggle, and Developer Performance Stats HUD.
- [x] Full regression and visual verification:
  - [x] Monorepo build check (`npm run build`).
  - [x] 12-Stage automated multiplayer test (`node test-multiplayer.mjs`).
  - [x] Dual-browser Puppeteer visual test (`node test-browser-e2e.mjs`) with zero console errors.
  - [x] Save before and after screenshots.
  - [x] Commit and push branch `phase-2-visual-overhaul` to GitHub.
