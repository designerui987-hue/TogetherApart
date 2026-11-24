# Together Apart 💖

A cozy, couple-friendly 3D browser-based cooperative adventure game built with **TypeScript**, **Three.js**, **Rapier 3D physics**, **Node.js**, and **Socket.IO**.

Inspired by the teamwork philosophy of *It Takes Two*, two players must communicate and combine their unique magical powers to traverse floating sky islands, solve cooperative puzzles, and unlock the ancient Heart Gate.

---

## 🎨 Phase 2: Premium Visual Overhaul Highlights

- **Art Direction & Atmosphere**:
  - Warm, evocative miniature fantasy aesthetic inspired by *It Takes Two*, *Unravel Two*, and *Sky: Children of the Light*.
  - Procedural celestial gradient sky dome fading from warm sunrise peach (`#FFD6BA`) through magical lavender (`#B6A1E4`) to calm sky blue (`#6096FD`).
  - Warm directional sunlight ($5200\text{K}$) with soft PCF shadow maps, lavender fill bounce, and atmospheric depth fog.
  - Multi-tier layered floating clouds drifting organically across the horizon.
- **Sculpted Concept-Matched Characters**:
  - ✨ **Lumi (The Light Weaver)**:
    - Expressive chibi face with anime eye gradients, iris reflections, and natural blinking eyelids.
    - Soft wavy coral-pink hair with parted bangs, twin playful side curls, and bouncing ponytail.
    - Layered fairy dress with scalloped hem frills, ruby collar brooch, white leggings, and buckled boots.
    - Translucent glowing butterfly/fairy wings with delicate veins and harmonic flight flutter.
    - Flowing golden silk scarf with secondary multi-segment wave physics.
  - ⚡ **Nova (The Kinetic Shaper)**:
    - Expressive face with golden-brown skin tone, pointed elven ears, and alert pupils with electric cyan catchlight.
    - Swept dynamic turquoise hair crest.
    - Winged golden crest helm with central luminous amber power jewel.
    - Adventurer's teal tunic, sturdy leather belt with oversized circular brass buckle, and cuff boots.
    - Oversized magical kinetic gauntlets with glowing power vents and brass plates.
    - Orbiting satellite kinetic crystals that spin and flare during pulse ability activations.
- **Living Organic World ("The Island of Connection")**:
  - Sculpted irregular island topography with organic cantilever overhangs, rounded moss lips, and stratified sedimentary rock underbellies.
  - Cobblestone pathways leading toward objectives.
  - Instanced wildflowers (coral, yellow, turquoise, white daisies) and grass tufts.
  - Stylized multi-tiered cloud canopy trees with gentle wind sway.
  - Bioluminescent fairy mushroom clusters and glowing crystal formations.
  - Animated waterfalls cascading into the sky mist with edge foam and rainbow particles.
  - Ambient environmental life: drifting fireflies, pollen motes, and animated fluttering butterflies.
- **Cinematic Post-Processing Pipeline**:
  - Selective `UnrealBloomPass` calibrated to add magical fairy-tale luminescence to crystals, starlight platforms, eyes, and energy conduits without washing out terrain.
  - Custom `VignetteColorGradeShader` providing subtle warm corner vignette and cinematic pastel contrast.
  - Correct sRGB linear color management and ACES Filmic tone mapping.
- **Scalable Graphics Quality Presets**:
  - **Low**: Maximum performance, direct WebGL rendering, shadows disabled, 1.0 pixel ratio.
  - **Medium**: High-performance balance, 1.25 pixel ratio, 1024px shadows, selective bloom.
  - **High** (Default): 1.75 pixel ratio, 2048px soft shadows, bloom, vignette, color grading.
  - **Ultra**: 2.0 pixel ratio, 2048px soft shadows, full bloom, vignette, color grading, max particles.
- **Developer Performance HUD**:
  - Toggleable real-time overlay showing FPS, frame time (ms), draw calls, and triangle count.
- **Camera & Game Feel**:
  - Sprint FOV expansion (smooth transition from 58° to 64°).
  - Ground collision raycast avoidance preventing terrain clipping.
  - Reduced Motion accessibility toggle.
  - Living 3D animated main menu showcase camera.

---

## 👥 Playable Characters & Abilities

1. **Lumi (The Light Weaver)**:
   - **Special Ability (`Q`)**: **Starlight Platform** — Casts a temporary luminous prismatic platform in mid-air (lasting 6 seconds) with rotating gold rune rings and sparkle particles. Allows both Lumi and Nova to bridge wide chasms or gain vertical reach.
2. **Nova (The Kinetic Shaper)**:
   - **Special Ability (`Q`)**: **Pulse Flux** — Emits a kinetic pulse wave and punches forward with oversized gauntlets, awakening ancient magnetic spires and moving floating platforms.

---

## 🏝️ Cooperative Challenges (The Island of Connection)

1. **Challenge 1: The Trust Bridge**:
   - One player stands on the ornate brass spiral pressure plate to raise the wooden rope bridge across the chasm.
   - The second player crosses and activates the crystal gear lever to permanently lock the bridge open with a burst of gold light.
2. **Challenge 2: The Magical Crossing**:
   - A wide gap between floating islands. Lumi casts a **Starlight Platform** in mid-air.
   - Nova jumps onto it and fires a **Kinetic Pulse** at the floating obelisk mechanism with spinning gyroscope rings, awakening the magnetic moving platform.
3. **Challenge 3: The Heart Gate**:
   - Monumental stone archway carved into intertwined hearts with engraved celestial runes.
   - Coral and turquoise glowing energy conduits run along the ground from switches 1 & 2 to the arch.
   - Both players must activate their switches within a **1.8-second synchronization window** to slide open the massive double doors.
4. **Victory Summit**:
   - Both players step through the portal onto the marble shrine dais (Z > 125) to trigger the victory fanfare, celebratory heart fireworks, and chapter summary stats.

---

## 🎮 Controls

### Online Co-Op / Player 1 (WASD)
| Action | Key / Input |
|---|---|
| **Move** | `W`, `A`, `S`, `D` |
| **Jump** | `Space` (Variable height, coyote time, jump buffering & landing squash) |
| **Sprint** | `Shift` (1.5x speed boost with sprint FOV kick & particle trail) |
| **Interact / High-Five** | `E` (When near partner or puzzle switches) |
| **Special Ability** | `Q` (Lumi: Starlight Platform / Nova: Kinetic Pulse) |
| **Look / Camera Orbit** | `Mouse` (Click canvas to lock cursor, `Esc` to unlock) |
| **Pause / Release Mouse** | `Esc` |

### Local Shared-Screen Mode (Player 2: Nova)
| Action | Key / Input |
|---|---|
| **Move** | `Arrow Keys` (Up, Left, Down, Right) |
| **Jump** | `Right Ctrl`, `Numpad 0`, or `/` |
| **Sprint** | `Right Shift` |
| **Interact / High-Five** | `Enter` or `L` |
| **Special Ability** | `K` or `Numpad 1` |

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
2. In the lobby, Player 1 clicks **Copy Room Code** (a 6-character code such as `MK8ZLP`).
3. Player 2 opens `http://localhost:3001` in another browser tab or computer, clicks **Join Room**, enters the room code and their name, and joins.
4. Both players click **I'm Ready!**.
5. Player 1 clicks **Start Adventure**.

### 5. Playing Locally (Shared Keyboard Co-Op)
1. Open `http://localhost:3001`.
2. Click **Local Play (Shared Screen)**.
3. Player 1 controls Lumi with `W/A/S/D` and `Q/E/Space`.
4. Player 2 controls Nova with `Arrow Keys` and `K/L/Right Ctrl`.
5. The dynamic camera will automatically frame both players.

---

## 🧪 Testing & Verification

Run the automated test suites:

```bash
# 1. 12-Stage Automated Multiplayer Test Suite
node test-multiplayer.mjs

# 2. Dual-Browser End-to-End Visual Test with Screenshots
node test-browser-e2e.mjs
```

Screenshots captured during testing:
- `screenshots/baseline/player1_ingame.png` (Prototype baseline)
- `screenshots/main_menu_upgraded.png` (Upgraded Main Menu with living 3D world backdrop)
- `screenshots/lobby_upgraded.png` (Upgraded Lobby with character avatars & cards)
- `screenshots/player1_upgraded.png` (Upgraded Player 1 with post-processing, bloom, atmospheric lighting, and high-quality character mesh)
- `screenshots/player2_upgraded.png` (Upgraded Player 2 in-game)
