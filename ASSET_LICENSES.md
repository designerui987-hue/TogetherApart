# Together Apart — Asset & License Documentation

## 1. Overview
Together Apart is built entirely using **100% original procedural geometry, custom Three.js PBR shaders, and the native HTML5 Web Audio API**. No external copyrighted meshes, textures, proprietary sound libraries, or commercial game packages were copied or imported.

---

## 2. Asset Breakdown & Attribution

| Asset Category | Implementation Method | License / Origin |
|---|---|---|
| **Lumi Character Model** | Custom procedural Three.js hierarchy (Capsules, Spheres, Extruded wings, Bézier curves) | Original (MIT License) |
| **Nova Character Model** | Custom procedural Three.js hierarchy (Torso, Elven ears, Winged crest, Gauntlets, Gyroscopes) | Original (MIT License) |
| **Character Animations** | Procedural bone math & secondary spring/wave physics (bouncing hair, wing flutter, scarf wave) | Original (MIT License) |
| **Island Terrain & Strata** | Procedural multi-tier sedimentary cones & organic overhanging grass slabs | Original (MIT License) |
| **Vegetation & Flora** | Instanced low-poly wildflowers, cloud-canopy trees & glowing fairy mushrooms | Original (MIT License) |
| **Waterfalls & Mist** | Multi-layered UV scrolling procedural shaders & plunge mist particle emitters | Original (MIT License) |
| **Sky & Atmosphere** | Custom GLSL radial gradient hemisphere sky dome & procedural layered clouds | Original (MIT License) |
| **Sound Effects & Music** | Generative HTML5 Web Audio API synthesizer (oscillators, noise bursts, biquad filter sweeps) | Original (MIT License) |
| **UI Fonts** | Outfit & Quicksand (Google Fonts) | SIL Open Font License (OFL) |
| **Icons & Emojis** | Standard UTF-8 Unicode glyphs & procedural CSS icons | Universal / Public Domain |

---

## 3. Third-Party Dependencies (Open Source)

| Package | Version | Purpose | License |
|---|---|---|---|
| `three` | `^0.164.1` | 3D WebGL rendering engine & post-processing | MIT |
| `@dimforge/rapier3d-compat` | `^0.13.1` | 3D physics simulation & character collisions | Apache-2.0 |
| `socket.io` / `socket.io-client` | `^4.7.5` | Real-time WebSocket multiplayer networking | MIT |
| `express` | `^4.19.2` | HTTP backend & static asset serving | MIT |
| `vite` | `^5.2.10` | Frontend bundler & development server | MIT |
| `typescript` | `^5.4.5` | Type-safe JavaScript compiler | Apache-2.0 |
