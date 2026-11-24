# Together Apart — Visual Design Document (Phase 2 Upgrade)

## 1. Vision & Emotional Aesthetic
Together Apart's visual redesign transforms the low-poly prototype into an evocative, miniature fantasy world bursting with warmth, wonder, and handcrafted charm.
Drawing inspiration from **It Takes Two** (miniature environmental density, rich tactile materials), **Unravel Two** (soft warm rim lighting, emotional co-op intimacy), and **Sky: Children of the Light** (luminous pastel atmospheres and cinematic cloudscapes), the game feels romantic, cozy, and vibrant without ever overwhelming the player with visual noise.

---

## 2. Color Direction & Lighting Palette

### Hero Colors
- **Lumi Coral**: `#F28B9D` (Warm, radiant, soft peach-pink magic)
- **Nova Turquoise**: `#56C5D5` (Vibrant cyan, energetic pulse, crisp teal)
- **Heart / Magic Lavender**: `#B6A1E4` (Cooperative synergy, mystical energy, dusk horizon)
- **Forest Mint**: `#83BA83` (Lush moss, weeping willow leaves, organic grass crests)
- **Golden Light**: `#F3CD82` (Warm sunlight, starlight platforms, glowing runes)
- **Warm Cream**: `#F9EDDC` (Weathered island stone, ancient marble, soft highlights)

### Atmospheric Composition
- **Sky**: Multi-tiered radial gradient with soft peach horizon fading into serene lavender-cerulean upper atmosphere.
- **Lighting**:
  - Key Light: Warm golden sunlight ($5200\text{K}$, `#FFF4E0`) at $42^\circ$ elevation casting soft, graduated PCF shadows.
  - Fill Light: Soft lavender-turquoise ambient sky bounce illumination ($0.65\times$ intensity) to keep shadow areas painterly rather than harsh black.
  - Rim / Accent Light: Gentle upward turquoise backlight simulating magical cloud bounce reflections.

---

## 3. Character Redesign (Concept-Matched Sculpting)

### Lumi — The Light Weaver
- **Head & Face**: Delicate chibi proportions, soft cheeks, anime-inspired large expressive eyes with golden-amber iris gradient and specular glints, procedural eyelids for natural blinking.
- **Hair**: Wavy coral-pink locks with soft side-swept fringe, hair tufts, and twin tied playful curls that react to movement inertia.
- **Attire**: Layered fairy dress in warm cream and pastel coral with scalloped hem frills, golden brooch at collar, white stockings, and warm brown buckled boots.
- **Wings & Scarf**:
  - Twin translucent butterfly/fairy wings with glowing internal veins that flutter with variable frequency during idle, jump, and sprint.
  - Flowing magical silk scarf with multi-segment physics wave simulation trailing behind movement.

### Nova — The Kinetic Shaper
- **Head & Face**: Warm golden skin tone, cute elven pointed ears, swept turquoise hair with a signature dynamic crest, expressive alert eyes with subtle kinetic cyan spark.
- **Headpiece**: Winged golden crest helmet with curved turquoise accents and central luminous amber power gem.
- **Attire**: Adventurer's blue & teal tunic with gold-trimmed lapels, sturdy leather utility belt with oversized circular brass buckle, dark slate trousers, and cuff boots.
- **Gauntlets & Tech**:
  - Oversized magical kinetic gauntlets with glowing power vents and brass knuckle plates.
  - Orbiting satellite crystal relics that hover dynamically beside Nova and spin rapidly during pulse ability activations.

---

## 4. Environment & World Design ("The Island of Connection")

### Terrain & Strata
- Islands are no longer simple geometric slabs. They feature:
  - Irregular, sculpted perimeter contours with organic cantilever overhangs.
  - Multi-tier sedimentary rock layers with earthy slate, sandstone, and warm brown clay strata.
  - Rounded, lush mossy edges that spill organically over rock lips.
  - Surface micro-relief with cobblestone pathways, soil patches, and wildflower clusters.

### Foliage & Vegetation
- **Stylized Cloud-Canopy Trees**: Twisted organic timber trunks with multi-tiered fluffy foliage puffs, normal-mapped lighting, and subtle vertex wind sway.
- **Instanced Floral Carpet**: Dense clusters of low-poly daisies, bellflowers, and four-leaf clovers that scatter naturally across grassy plateaus.
- **Fairy Mushrooms & Ferns**: Clusters of bioluminescent mushroom caps that pulse gently in shady glades.

### Waterfalls & Dynamic Mist
- Waterfalls cascade off island cliff edges, featuring multi-layered UV scrolling foam, edge refraction, and billowing mist particles at plunge points with localized rainbow arcs.

---

## 5. Puzzle Art & Visual Feedback

1. **The Trust Bridge**:
   - Heavy timber planks with weathered wood grain, iron bolts, and braided rope railings with curved posts.
   - Pressure plate: Ornate brass and amber stone disc embedded with spiral runes that glow and depress under weight.
   - Locking lever: Crystal gear mechanism that locks with a dramatic burst of gold energy ribbons.
2. **The Magical Crossing**:
   - Starlight Platform: Translucent iridescent prism surface with rotating perimeter rune ring and floating countdown ring indicating remaining duration.
   - Nova's Kinetic Mechanism: Floating obelisk with spinning concentric gyroscope rings that align and pulse upon hit, shooting a sustained magnetic beam to the moving platform.
3. **The Heart Gate**:
   - Monumental monolithic archway shaped into twin intertwined heart halves carved from ancient cream stone and overgrown with blossoming vines.
   - Dual glowing energy conduits that trace along stone pathways from switches 1 & 2 to the archway, filling with light upon synchronized activation.
   - Massive stone double doors with engraved celestial carvings that part smoothly with glowing light shafts.

---

## 6. Post-Processing & Graphics Presets
- Built on Three.js `EffectComposer`:
  - `RenderPass`: High-fidelity base pass with sRGB linear color correction.
  - `UnrealBloomPass`: Soft, selective threshold bloom ($0.75$ threshold, $0.45$ strength) targeting only magical crystals, starlight platforms, eye highlights, and energy conduits.
  - `ShaderPass` (Vignette & Color Grade): Gentle warm corner vignette and cinematic pastel contrast curve.
- Scalable Graphics Presets:
  - **Low**: Native pixel ratio 1.0, shadows 1024px, no post-processing bloom, reduced particle density.
  - **Medium**: Pixel ratio 1.25, shadows 1536px, soft bloom, full particles.
  - **High**: Pixel ratio 1.5, shadows 2048px, soft bloom + color grading, full particles.
  - **Ultra**: Pixel ratio 2.0, shadows 2048px PCF soft, bloom, vignette, full volumetric godray approximations.
