# Together Apart — Visual Upgrade Implementation Tasks

## Phase 2 Roadmap & Verification Checklist

- [x] **Task 1: Branch & Baseline Capture**
  - [x] Create git branch `phase-2-visual-overhaul`.
  - [x] Archive prototype baseline screenshots to `screenshots/baseline/`.
  - [x] Author `VISUAL_DESIGN.md` and `VISUAL_UPGRADE_TASKS.md`.

- [ ] **Task 2: Rendering Engine & Post-Processing Upgrade (`SceneManager.ts`)**
  - [ ] Implement Three.js `EffectComposer` pipeline with `RenderPass`, `UnrealBloomPass`, and custom color grading / vignette shader.
  - [ ] Configure sRGB color space, ACESFilmicToneMapping, calibrated exposure ($1.15$), and cinematic hemisphere + key sunlight.
  - [ ] Add tiered quality presets (Low, Medium, High, Ultra) with dynamic shadow map, bloom, and pixel ratio switching.
  - [ ] Implement layered procedural gradient sky dome and atmospheric ground fog.

- [ ] **Task 3: Character Model Overhaul (`CharacterModel.ts`, `RemotePlayer.ts`)**
  - [ ] Sculpt detailed procedural **Lumi**:
    - [ ] Expressive chibi face with anime eye gradients, iris pupils, procedural blinking eyelids.
    - [ ] Styled coral-pink hair with wavy bangs, twin playful side curls.
    - [ ] Layered fairy dress with scalloped frills, brooch jewel, stockings, and buckled boots.
    - [ ] Translucent butterfly/fairy wings with glowing internal veining and harmonic flutter.
    - [ ] Flowing silk scarf with secondary wave physics.
  - [ ] Sculpt detailed procedural **Nova**:
    - [ ] Expressive chibi face with elven pointed ears and energetic eye sparks.
    - [ ] Swept dynamic turquoise hair crest.
    - [ ] Winged golden crest helmet with central amber gem.
    - [ ] Detailed adventurer tunic, circular brass belt buckle, dark trousers, and cuff boots.
    - [ ] Oversized magical kinetic gauntlets with glowing power vents.
    - [ ] Orbiting satellite crystal relics with rotational momentum.
  - [ ] Universal character animation state machine:
    - [ ] Idle breathing & blinking.
    - [ ] Dynamic walk/run cycles with torso bob and arm swing.
    - [ ] Jump anticipation, liftoff, mid-air apex glide, falling pose, and landing squash/stretch.
    - [ ] Running lean/banking into turns.
    - [ ] Emote states: high-five raise, celebratory victory dance, respawn recovery.

- [ ] **Task 4: Environment Overhaul (`IslandLevel.ts`)**
  - [ ] Organic island terrain: layered rock strata, curved overhanging grass lips, surface moss and cobblestone pathways.
  - [ ] Instanced procedural foliage:
    - [ ] Stylized multi-tiered cloud canopy trees with wind sway.
    - [ ] Wildflower tufts (coral, golden, lavender, and white).
    - [ ] Ferns, bushes, and glowing fairy mushrooms.
  - [ ] Animated waterfalls with multi-layered UV foam, plunge mist particles, and rainbow specular sheen.
  - [ ] Ambient world dressing: floating background islets in atmospheric depth, layered drifting clouds, floating fireflies, and wind pollen.

- [ ] **Task 5: Puzzle Visual Redesign & Visual Effects (`IslandLevel.ts`, `ParticleSystem.ts`)**
  - [ ] Challenge 1: Weathered timber Trust Bridge with rope posts, brass spiral pressure plate, and crystal gear lever with locking sequence.
  - [ ] Challenge 2: Prismatic iridescent Starlight Platform with perimeter rune dial and lifetime countdown ring; Nova kinetic obelisk with spinning gyroscope rings and sustained magnetic beam.
  - [ ] Challenge 3: Grand Heart Gate archway with engraved stone runes, coral/turquoise glowing energy conduits running along the ground, sliding double doors, and sunlight godray bursts.
  - [ ] VFX: Jump dust puffs, landing squash bursts, sprint particle trails, high-five heart fireworks explosion, checkpoint light columns, and victory celebration confetti.

- [ ] **Task 6: Camera, Game Feel & HUD/UI Polish (`CameraController.ts`, `UIManager.ts`, `style.css`)**
  - [ ] Camera sprint FOV expansion, landing impact damping, and cinematic puzzle camera framing.
  - [ ] Premium Glassmorphism UI 2.0 with iridescent borders, animated live 3D menu backdrop, expressive character portrait frames, circular cooldown dial, and partner compass.
  - [ ] Settings menu: Quality preset selector (Low, Medium, High, Ultra), Reduced Motion mode, Sound Volume, and Dev Performance Overlay.
  - [ ] Performance overlay displaying real-time FPS, frame time, draw calls, and triangle count.

- [ ] **Task 7: Regression Testing & Delivery**
  - [ ] Verify `npm run build` compiles with zero errors.
  - [ ] Verify `node test-multiplayer.mjs` passes all 12 stages.
  - [ ] Verify `node test-browser-e2e.mjs` runs with zero console errors and captures upgraded screenshots.
  - [ ] Update `README.md`, `TASKS.md`.
  - [ ] Commit all changes to `phase-2-visual-overhaul`.
