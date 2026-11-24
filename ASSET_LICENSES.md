# Together Apart — Asset Licenses & Provenance Documentation

All assets utilized in **Together Apart** are either 100% original procedural/authored creations designed specifically for this project or derived from permissive open-source frameworks.

---

## 1. Original 3D Character Models & Animations

- **Lumi (The Light Weaver)**:
  - **Source File**: `tools/blender/sources/lumi.blend`
  - **Exported Asset**: `packages/client/public/assets/characters/lumi/lumi.glb`
  - **Author**: Together Apart Development Team
  - **License**: MIT / Creative Commons Zero (CC0 1.0 Universal)
  - **Description**: Original stylized chibi fantasy character featuring coral-pink hair, layered fairy dress, translucent flutter wings, and flowing scarf. Generated via custom Blender Python scripts with rigged armature and 14 animation actions.

- **Nova (The Kinetic Shaper)**:
  - **Source File**: `tools/blender/sources/nova.blend`
  - **Exported Asset**: `packages/client/public/assets/characters/nova/nova.glb`
  - **Author**: Together Apart Development Team
  - **License**: MIT / Creative Commons Zero (CC0 1.0 Universal)
  - **Description**: Original stylized chibi fantasy character featuring turquoise hair crest, winged golden helmet, adventurer tunic, oversized kinetic gauntlets, and orbiting crystal relics. Generated via custom Blender Python scripts with rigged armature and 14 animation actions.

---

## 2. Original Environment & Architectural Assets

- **Trees & Foliage**:
  - `fantasy_tree.glb`, `willow_tree.glb`, `flowering_tree.glb`, `sapling.glb`, `grass_tuft.glb`, `fern.glb`, `daisy.glb`, `lavender.glb`, `fairy_mushroom.glb`
  - **Source File**: `tools/blender/sources/environment.blend`
  - **Author**: Together Apart Development Team
  - **License**: MIT / CC0 1.0 Universal

- **Terrain & Architecture**:
  - `floating_island_base.glb`, `cliff_rock.glb`, `moss_rock.glb`, `pebbles.glb`, `bridge_plank.glb`, `rope_post.glb`, `stone_pillar.glb`, `crystal_pedestal.glb`, `ancient_archway.glb`, `cozy_gazebo.glb`, `magical_lantern.glb`, `heart_gate.glb`
  - **Source File**: `tools/blender/sources/environment.blend`
  - **Author**: Together Apart Development Team
  - **License**: MIT / CC0 1.0 Universal

---

## 3. Procedural Audio Synthesizer

- **Sound Effects & Ambient Music**:
  - **Engine**: Native HTML5 Web Audio API (`SoundSynth.ts`)
  - **Author**: Together Apart Development Team
  - **License**: MIT
  - **Description**: 100% synthetically generated audio using mathematical oscillators, noise generators, envelope filters, and biquad filter nodes. No external audio recordings, samples, or MP3/WAV files required.

---

## 4. Software Dependencies & Libraries

| Library | Version | License | Usage |
| :--- | :--- | :--- | :--- |
| **Three.js** | `^0.160.0` | MIT | WebGL 3D Rendering Engine & Post-Processing |
| **@dimforge/rapier3d-compat** | `^0.13.0` | Apache-2.0 | Deterministic 3D Physics & Collision Simulation |
| **Socket.IO** | `^4.7.2` | MIT | Real-time WebSocket Client & Server |
| **Express** | `^4.18.2` | MIT | HTTP Server & Static Asset Delivery |
| **Blender** | `5.3.0` | GPL-3.0 | Asset Generation & Export Pipeline Tooling |
