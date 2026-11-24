# Together Apart - Game Design Document (GDD)

## 1. Executive Summary
**Together Apart** is a cozy, couple-friendly 3D cooperative adventure game built for the web browser. Inspired by the teamwork philosophy of *It Takes Two*, two players must communicate and coordinate complementary magical abilities to navigate floating sky islands, solve cooperative puzzles, and rekindle the ancient Heart Gate.

## 2. Core Pillars
1. **Mandatory Teamwork**: No challenge can be solved alone. Every obstacle requires timing, complementary powers, or mutual assistance.
2. **Cozy, Low-Stress Platforming**: Unlimited retries, immediate respawn at recent safe checkpoints, forgiving jump physics (coyote time, jump buffering), and no friendly fire.
3. **Couple-Friendly Interactions**: High-five celebration mechanic (`E` key when near partner), mutual heart particle bursts, encouraging status messages, and synchronized emotes.
4. **Instant Accessibility**: Browser-based with private 6-character room codes. No downloads, account registrations, or paid API keys required. Also supports shared keyboard local play.

## 3. Playable Characters

### Lumi (The Light Weaver)
- **Palette**: Warm coral pink, soft peach, glowing golden amber.
- **Visuals**: Expressive procedural character with light-orb antenna, floating cloak/wings, and animated emotive eye-spots.
- **Unique Ability: "Starlight Bridge" (Key: Q)**: Casts a temporary luminous platform underfoot or ahead (lasting 6 seconds) with warm particle sparkles. Allows both Lumi and Nova to bridge deadly chasms or gain vertical reach.

### Nova (The Kinetic Shaper)
- **Palette**: Deep turquoise blue, cool cyan, vibrant mint green.
- **Visuals**: Expressive procedural character with magnetic crystal horns, hovering floating orbs, and energetic eye-spots.
- **Unique Ability: "Pulse Flux" (Key: Q)**: Emits a kinetic pulse that activates dormant crystal mechanisms, pulls magnetic floating platforms, or moves designated heavy puzzle stones.

---

## 4. First Level: The Island of Connection

### Environment & Art Style
- **Setting**: Lush floating islands bathed in gentle golden-hour sunlight and soft pastel fog.
- **Biomes & Props**: Floating grassy landmasses, weeping willow trees, luminous crystals, animated rolling clouds, cascading waterfalls falling into the sky, wooden rope bridges, and mossy stone ruins.
- **Color Palette**:
  - Coral Pink (`#FF6B8B`)
  - Turquoise Blue (`#2ED8D8`)
  - Lavender Fog (`#B39DDB`)
  - Mint Foliage (`#69F0AE`)
  - Warm Cream Stone (`#FFF8E7`)
  - Golden Amber Magic (`#FFD54F`)

### The Three Cooperative Challenges

#### Challenge 1: The Trust Bridge
- **Setup**: A collapsed wooden rope bridge spans a misty gorge. On Lumi's side sits a pressure plate; across the chasm sits an ancient crystal gear lever.
- **Mechanic**:
  1. Lumi steps onto and holds the pressure plate, raising the bridge segments for Nova.
  2. Nova crosses safely to the other side.
  3. Nova uses their Kinetic Pulse (`Q`) or interaction (`E`) on the crystal gear to lock the bridge in place permanently.
  4. Lumi can now step off the plate and cross safely.

#### Challenge 2: The Magical Crossing
- **Setup**: A wide gap with turbulent vertical drafts and two distant floating platforms that are out of standard jump range.
- **Mechanic**:
  1. Lumi conjures a Starlight Platform midway across the first gap.
  2. Nova jumps onto the Starlight Platform and hits the floating magnetic crystal with Pulse Flux (`Q`), causing a second moving platform to glide into position.
  3. Both players jump across the moving platform onto the safe mid-island plateau.

#### Challenge 3: The Heart Gate
- **Setup**: An imposing ancient stone archway sealed by twin intertwined crystalline seals.
- **Mechanic**:
  1. Two separate conduits lead to switches spaced 15 meters apart.
  2. Both players must position themselves on their respective conduits and activate their switch within a 1.5-second synchronization window.
  3. Upon simultaneous activation, glowing magical energy flows along the ground runes into the Heart Gate, shattering the seals with a grand burst of heart and starlight particles.
  4. Both players step through the portal onto the summit to trigger the victory celebration.

---

## 5. Controls & Accessibility

### Online Mode (Default)
- **W, A, S, D**: Movement (forward, left, back, right)
- **Space**: Jump (variable height, coyote time, jump buffering)
- **Shift**: Sprint (1.5x speed boost)
- **E**: Interact / High-Five (when standing near partner)
- **Q**: Character Special Ability (Lumi: Platform / Nova: Kinetic Pulse)
- **Mouse**: Camera orbit (third-person view with collision prevention)
- **Esc**: Pause menu / Toggle mouse lock

### Local Shared-Keyboard Mode
- **Player 1 (Lumi)**: `W, A, S, D` for move, `Space` for jump, `Left Shift` for sprint, `E` for interact/high-five, `Q` for ability.
- **Player 2 (Nova)**: `Arrow Keys` for move, `Numpad 0` / `Right Ctrl` for jump, `Right Shift` for sprint, `Enter` / `L` for interact, `K` / `Numpad 1` for ability.
- **Camera**: Shared intelligent dynamic framing camera (expands framing when players separate, zooms in when close together).

---

## 6. Audio Design (Web Audio Procedural Synthesizer)
To guarantee zero 404 asset failures and zero external bandwidth dependency:
- **Footsteps**: Soft procedural white noise burst with low-pass filtering.
- **Jump**: Gentle rising frequency chirp.
- **Lumi Ability**: Shimmering bell/arpeggio chord with FM synthesis.
- **Nova Ability**: Deep resonant kinetic pulse / crystal resonance sound.
- **High-Five**: Warm resonant chord + cheerful sparkle chime.
- **Switch / Pressure Plate**: Satisfying mechanical click & low thud.
- **Ambient Soundtrack**: Continuous generative ambient chords (warm synth pads with gentle low-frequency oscillation and reverb).
