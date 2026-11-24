# Together Apart — 3D Asset Pipeline & Technical Specification

## 1. Overview & Vision

The **Together Apart 3D Asset Pipeline** establishes a professional, reproducible, and fully version-controlled workflow for creating, rigging, texturing, animating, and integrating stylized 3D assets into our browser-based Three.js game.

This pipeline bridges:
1. **Automated Content Creation**: Headless Blender 5.3 (`bpy`) Python scripts creating original geometries, armatures, vertex weights, and keyframed actions.
2. **Source Preservation**: Fully editable Blender source files (`.blend`) stored in `tools/blender/sources/`.
3. **Optimized Binary Delivery**: GlTF Binary (`.glb`) files exported directly into `packages/client/public/assets/`.
4. **Client-Side Asset Management**: Centralized `AssetManager.ts` featuring caching, progress tracking, `SkeletonUtils.clone()` for skinned meshes, and procedural fallback models.

---

## 2. Directory Architecture

```text
packages/client/public/assets/
  characters/
    lumi/
      lumi.glb               # Skinned mesh + 14 keyframed animation clips
      lumi_diffuse.png       # Stylized texture atlas (optional/embedded)
    nova/
      nova.glb               # Skinned mesh + 14 keyframed animation clips
      nova_diffuse.png
  environment/
    trees/
      fantasy_tree.glb
      willow_tree.glb
      flowering_tree.glb
      sapling.glb
    rocks/
      cliff_rock.glb
      moss_rock.glb
      pebbles.glb
    plants/
      grass_tuft.glb
      fern.glb
      daisy.glb
      lavender.glb
    mushrooms/
      fairy_mushroom.glb
    islands/
      floating_island_base.glb
    bridges/
      bridge_plank.glb
      rope_post.glb
    architecture/
      stone_pillar.glb
      crystal_pedestal.glb
      ancient_archway.glb
      cozy_gazebo.glb
      magical_lantern.glb
      heart_gate.glb
  textures/                  # Shared noise, roughness, and normal maps
  animations/                # Reusable animation tracks
  particles/                 # Particle sprites
  ui/                        # HUD icons and emote badges
  audio/                     # Audio cues (Web Audio synth presets)
  asset-manifest.json        # Central asset manifest with paths & budgets

tools/
  blender/
    sources/                 # Editable .blend master project files
    generate_characters.py   # Automated Blender script for Lumi & Nova
    generate_environment.py  # Automated Blender script for environment assets
    export_glb.py            # Headless export utility
  asset-optimization/
    optimize_gltf.mjs        # Node-based gltf-transform / meshopt optimizer
```

---

## 3. Character Rigging & Animation Standard

### 3.1 Skeletal Hierarchy
Both Lumi and Nova share a standardized humanoid armature designed for couple interactions:
```text
Root
 └── Hips
      ├── Spine
      │    └── Chest
      │         ├── Neck
      │         │    └── Head
      │         │         ├── Hair_Bangs / Crest
      │         │         └── Accessories (Halo/Horns/Ears)
      │         ├── Clavicle.L -> UpperArm.L -> Forearm.L -> Hand.L
      │         ├── Clavicle.R -> UpperArm.R -> Forearm.R -> Hand.R
      │         ├── Wings.L / Scarf.01
      │         └── Wings.R / Scarf.02
      ├── Thigh.L -> Shin.L -> Foot.L -> Toe.L
      └── Thigh.R -> Shin.R -> Foot.R -> Toe.R
```

### 3.2 Standard Named Animation Clips
All character models contain embedded NLA tracks matching the following canonical names:
1. `Idle`: Subtle breathing, gentle vertical spine bob, wing/satellite hover.
2. `Walk`: 4-beat cycle with alternating arm swing and foot lift.
3. `Run`: Dynamic forward lean, wider stride, active arm pumping.
4. `JumpStart`: Anticipation squash into upward spring liftoff.
5. `JumpLoop`: Apex float with relaxed limbs.
6. `Fall`: Downward descent with arms flared for balance.
7. `Land`: Ground impact squash and elastic recovery.
8. `Ability`: Character-specific magical cast gesture:
   - Lumi: Upward double-handed starry flourish.
   - Nova: Outstretched punch triggering kinetic gauntlet flare.
9. `HighFive`: Raised high-five prep and synchronized clap.
10. `Wave`: Friendly one-handed greeting gesture.
11. `Hug`: Synchronized open-arm embrace.
12. `Dance`: Playful two-step rhythmic sway.
13. `Celebrate`: Two-handed jump with victory fist pump.
14. `Respawn`: Emergence from starlight sphere and recovery.

---

## 4. Centralized Asset Loader (`AssetManager.ts`)

The client interacts with 3D assets exclusively through a singleton `AssetManager`:
- **Three.js `GLTFLoader`**: Asynchronous loading from local `/assets/...` URLs.
- **Skinned Mesh Safety**: Uses `SkeletonUtils.clone(gltf.scene)` so multiple instances (Local Player, Remote Player, Lobby Previews) have independent bone hierarchies, bone matrices, and `AnimationMixer` instances.
- **In-Memory Caching**: Loaded GLTF templates are cached in memory to avoid duplicate fetches.
- **Procedural Fallback**: If an asset file is unavailable or fails to load, `AssetManager` constructs an equivalent procedural mesh so the game never crashes or stalls.

---

## 5. Performance Budgets

| Asset Category | Target Triangles | Max Texture Size | Notes |
| :--- | :--- | :--- | :--- |
| **Lumi Character** | 8,000 – 14,000 | 1024 × 1024 | PBR material, vertex colors, bones $\le 32$ |
| **Nova Character** | 8,000 – 14,000 | 1024 × 1024 | PBR material, vertex colors, bones $\le 32$ |
| **Trees (each)** | 600 – 1,800 | 512 × 512 | Shared foliage material, instanced |
| **Plants & Foliage** | 80 – 400 | 256 × 256 | Instanced via `THREE.InstancedMesh` |
| **Rocks & Clifffaces**| 200 – 800 | 512 × 512 | Organic low-poly with tri-planar shading |
| **Puzzle Props** | 500 – 2,500 | 512 × 512 | Emissive highlights, moving parts |
| **Total Scene Budget**| $\le 35,000$ tris | $\le 60\text{ MB}$ VRAM | $60\text{ FPS}$ on integrated/low-tier GPUs |

---

## 6. Phase 2.6: Concept-Accurate Master Production Models

### 6.1 Specifications & Adherence
In Phase 2.6, Lumi and Nova were recreated from scratch in Blender 5.3 strictly matching the official concept sheets (`art-references/characters/lumi-concept.png` and `nova-concept.png`):

- **Lumi (The Light Weaver)**:
  - Proportions: 3.2 heads tall chibi adventure silhouette.
  - Sculpted stylized anatomy, soft cheeks, warm amber gradient eyes with highlights and dark upper eyelashes.
  - Coral pink wavy multi-layered hair with floral hair ornament and dangling star charm.
  - Cream and coral double-layered dress with scallop petal hems, gold star embroidery, and golden waist brooch.
  - Translucent 4-wing butterfly system with emissive starlight veins.
  - Flowing golden silk scarf draped over shoulders with star patterns and tapered tassels.
  - Brown adventurer boots with star-shaped buckles.
  - Source: `tools/blender/sources/lumi_reference_master.blend`
  - Export: `packages/client/public/assets/characters/lumi/lumi_v2.glb` (50 meshes, 10 materials, 14 actions, 7 shape keys).

- **Nova (The Kinetic Shaper)**:
  - Proportions: 3.1 heads tall chibi inventor silhouette.
  - Sculpted stylized anatomy, confident electric blue eyes, stylized elf ears with brass cuff accents.
  - Swept turquoise crest hair with dynamic bangs, side lock, and brass mono-goggle with glowing cyan kinetic lens.
  - High cowl scarf collar, deep navy adventurer coat with gold trim, geometric emblem, and split coat tails.
  - Sturdy utility belt with brass gear charm and stitched tool pouch.
  - Oversized mechanical kinetic gauntlets with segmented fingers and central glowing cyan kinetic emitter core.
  - Heavy brown adventurer boots with brass toe guards and ankle buckles.
  - Source: `tools/blender/sources/nova_reference_master.blend`
  - Export: `packages/client/public/assets/characters/nova/nova_v2.glb` (52 meshes, 11 materials, 14 actions, 7 shape keys).

### 6.2 Facial Shape Keys (Morph Targets)
Both models feature high-fidelity head mesh shape keys for expressive gameplay and cinematic cutscenes:
1. `Smile`: Relaxed, warm smile.
2. `Joyful` (Lumi) / `Confident` (Nova): Broad expressive happy mouth and uplifted cheeks.
3. `Focused`: Determined brow tilt and concentrated mouth line.
4. `Playful`: Asymmetric wink-smile.
5. `BlinkLeft` & `BlinkRight`: Independent natural eye blinks.
6. `MouthOpen`: Vocalization and astonishment.

### 6.3 3D Character Showcase & Preview Tools
- **In-Game Showcase Modal**: Accessible via the "✨ Character Showcase (3D Preview)" button on the main menu. Includes 3-point studio lighting, 360° turntable, wireframe toggle, 14 animation actions, morph target expression sliders, live triangle/mesh statistics, and a 2D concept art comparison split-view drawer.
- **Standalone Preview**: Accessible at `/preview.html` with full Three.js orbit controls.
- **Verification Sheets**: Side-by-side high-resolution comparison sheets rendered at 2367x1400 in `screenshots/phase2.6/` juxtaposing official concept sheets with 3D master turnarounds.
