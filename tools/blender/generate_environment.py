"""
Together Apart — Automated Environment & Architecture Asset Generator
Generates original, cohesive stylized 3D assets for trees, plants, mushrooms,
rocks, bridges, and architecture using Blender Python (bpy).
Saves editable master .blend source and exports production .glb files.
"""

import bpy
import bmesh
import math
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_mat(name, base_color, roughness=0.6, metallic=0.0, emission_color=(0,0,0,1), emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if 'Emission Color' in bsdf.inputs and emission_strength > 0:
            bsdf.inputs['Emission Color'].default_value = emission_color
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        if 'Alpha' in bsdf.inputs and alpha < 1.0:
            bsdf.inputs['Alpha'].default_value = alpha
            mat.blend_method = 'BLEND'
    return mat

def export_asset_glb(output_subpath):
    out_dir = os.path.abspath(os.path.join("packages/client/public/assets", os.path.dirname(output_subpath)))
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.abspath(os.path.join("packages/client/public/assets", output_subpath))

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_attributes=True
    )
    print(f"[Blender] Exported: {output_subpath} ({os.path.getsize(glb_path)} bytes)")

# -------------------------------------------------------------
# 1. TREES
# -------------------------------------------------------------
def make_fantasy_tree():
    clear_scene()
    wood_mat = create_pbr_mat("TreeWood", (0.38, 0.24, 0.16, 1.0), roughness=0.8)
    leaf_mat = create_pbr_mat("TreeLeafGreen", (0.36, 0.68, 0.38, 1.0), roughness=0.55)

    # Trunk
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=3.0, location=(0, 0, 1.5))
    trunk = bpy.context.active_object
    trunk.data.materials.append(wood_mat)

    # Cloud canopies (3 tiers)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.6, location=(0, 0, 3.2))
    c1 = bpy.context.active_object
    c1.scale = (1.2, 1.1, 0.8)
    c1.data.materials.append(leaf_mat)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.3, location=(0.4, 0.3, 4.2))
    c2 = bpy.context.active_object
    c2.scale = (1.1, 1.0, 0.75)
    c2.data.materials.append(leaf_mat)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.9, location=(-0.3, -0.2, 5.0))
    c3 = bpy.context.active_object
    c3.scale = (0.9, 0.9, 0.7)
    c3.data.materials.append(leaf_mat)

    export_asset_glb("environment/trees/fantasy_tree.glb")

def make_willow_tree():
    clear_scene()
    wood_mat = create_pbr_mat("WillowWood", (0.32, 0.22, 0.14, 1.0), roughness=0.85)
    leaf_mat = create_pbr_mat("WillowLeaf", (0.32, 0.62, 0.48, 1.0), roughness=0.5)

    # Gnarled trunk
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=2.8, location=(0, 0, 1.4))
    trunk = bpy.context.active_object
    trunk.scale = (1.0, 0.85, 1.0)
    trunk.data.materials.append(wood_mat)

    # Main dome
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.7, location=(0, 0, 3.4))
    dome = bpy.context.active_object
    dome.scale = (1.3, 1.3, 0.9)
    dome.data.materials.append(leaf_mat)

    # Drooping willow strands
    for angle in [0, 1.2, 2.4, 3.6, 4.8]:
        x = math.cos(angle) * 1.2
        y = math.sin(angle) * 1.2
        bpy.ops.mesh.primitive_cone_add(radius1=0.35, depth=1.6, location=(x, y, 2.2))
        strand = bpy.context.active_object
        strand.rotation_euler = (math.pi, 0, 0)
        strand.data.materials.append(leaf_mat)

    export_asset_glb("environment/trees/willow_tree.glb")

def make_flowering_tree():
    clear_scene()
    wood_mat = create_pbr_mat("FlowerWood", (0.42, 0.28, 0.18, 1.0), roughness=0.75)
    pink_leaf_mat = create_pbr_mat("BlossomPink", (0.94, 0.62, 0.72, 1.0), roughness=0.45)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=2.6, location=(0, 0, 1.3))
    trunk = bpy.context.active_object
    trunk.data.materials.append(wood_mat)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.4, location=(0, 0, 3.0))
    c1 = bpy.context.active_object
    c1.scale = (1.2, 1.2, 0.9)
    c1.data.materials.append(pink_leaf_mat)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0.3, -0.2, 3.8))
    c2 = bpy.context.active_object
    c2.data.materials.append(pink_leaf_mat)

    export_asset_glb("environment/trees/flowering_tree.glb")

def make_sapling():
    clear_scene()
    wood_mat = create_pbr_mat("SaplingWood", (0.45, 0.32, 0.2, 1.0), roughness=0.7)
    leaf_mat = create_pbr_mat("SaplingLeaf", (0.42, 0.78, 0.42, 1.0), roughness=0.5)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=1.2, location=(0, 0, 0.6))
    trunk = bpy.context.active_object
    trunk.data.materials.append(wood_mat)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.6, location=(0, 0, 1.3))
    c = bpy.context.active_object
    c.data.materials.append(leaf_mat)

    export_asset_glb("environment/trees/sapling.glb")

# -------------------------------------------------------------
# 2. PLANTS & MUSHROOMS
# -------------------------------------------------------------
def make_grass_tuft():
    clear_scene()
    mat = create_pbr_mat("GrassGreen", (0.35, 0.72, 0.35, 1.0), roughness=0.6)

    # 3 curved blades
    for rot in [0, 1.8, 3.6]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.7, location=(0, 0, 0.35))
        blade = bpy.context.active_object
        blade.rotation_euler = (0.25, 0, rot)
        blade.scale = (0.4, 1.0, 1.0)
        blade.data.materials.append(mat)

    export_asset_glb("environment/plants/grass_tuft.glb")

def make_fern():
    clear_scene()
    mat = create_pbr_mat("FernGreen", (0.28, 0.65, 0.32, 1.0), roughness=0.55)

    for i in range(5):
        angle = (i / 5.0) * math.pi * 2
        bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.85, location=(math.cos(angle)*0.2, math.sin(angle)*0.2, 0.35))
        frond = bpy.context.active_object
        frond.rotation_euler = (0.45, 0, angle)
        frond.scale = (0.3, 1.2, 1.0)
        frond.data.materials.append(mat)

    export_asset_glb("environment/plants/fern.glb")

def make_daisy():
    clear_scene()
    stem_mat = create_pbr_mat("DaisyStem", (0.3, 0.65, 0.3, 1.0), roughness=0.6)
    petal_mat = create_pbr_mat("DaisyPetal", (0.98, 0.98, 0.95, 1.0), roughness=0.3)
    center_mat = create_pbr_mat("DaisyCenter", (0.98, 0.82, 0.18, 1.0), roughness=0.4)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.5, location=(0, 0, 0.25))
    stem = bpy.context.active_object
    stem.data.materials.append(stem_mat)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.04, location=(0, 0, 0.52))
    center = bpy.context.active_object
    center.data.materials.append(center_mat)

    for i in range(8):
        a = (i / 8.0) * math.pi * 2
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.02, location=(math.cos(a)*0.16, math.sin(a)*0.16, 0.51))
        petal = bpy.context.active_object
        petal.scale = (0.6, 1.4, 1.0)
        petal.rotation_euler = (0, 0, a)
        petal.data.materials.append(petal_mat)

    export_asset_glb("environment/plants/daisy.glb")

def make_lavender():
    clear_scene()
    stem_mat = create_pbr_mat("LavStem", (0.3, 0.6, 0.3, 1.0), roughness=0.6)
    flower_mat = create_pbr_mat("LavFlower", (0.68, 0.52, 0.88, 1.0), roughness=0.45)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.6, location=(0, 0, 0.3))
    stem = bpy.context.active_object
    stem.data.materials.append(stem_mat)

    bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.35, location=(0, 0, 0.65))
    cone = bpy.context.active_object
    cone.data.materials.append(flower_mat)

    export_asset_glb("environment/plants/lavender.glb")

def make_fairy_mushroom():
    clear_scene()
    stalk_mat = create_pbr_mat("MushStalk", (0.92, 0.88, 0.82, 1.0), roughness=0.6)
    cap_mat = create_pbr_mat("MushCap", (0.92, 0.42, 0.55, 1.0), roughness=0.25, emission_color=(0.95, 0.5, 0.6, 1.0), emission_strength=0.9)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.55, location=(0, 0, 0.28))
    stalk = bpy.context.active_object
    stalk.data.materials.append(stalk_mat)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.4, location=(0, 0, 0.58))
    cap = bpy.context.active_object
    cap.scale = (1.0, 1.0, 0.55)
    cap.data.materials.append(cap_mat)

    export_asset_glb("environment/mushrooms/fairy_mushroom.glb")

# -------------------------------------------------------------
# 3. ROCKS & CLIFFS
# -------------------------------------------------------------
def make_cliff_rock():
    clear_scene()
    mat = create_pbr_mat("CliffStone", (0.52, 0.48, 0.46, 1.0), roughness=0.85)

    bpy.ops.mesh.primitive_cube_add(size=1.4, location=(0, 0, 0.7))
    rock = bpy.context.active_object
    rock.scale = (1.3, 0.9, 1.1)
    rock.data.materials.append(mat)

    export_asset_glb("environment/rocks/cliff_rock.glb")

def make_moss_rock():
    clear_scene()
    stone_mat = create_pbr_mat("MossStone", (0.45, 0.42, 0.4, 1.0), roughness=0.8)
    moss_mat = create_pbr_mat("TopMoss", (0.35, 0.65, 0.32, 1.0), roughness=0.7)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.9, location=(0, 0, 0.6))
    stone = bpy.context.active_object
    stone.scale = (1.2, 0.9, 0.65)
    stone.data.materials.append(stone_mat)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=0.1, location=(0, 0, 0.98))
    moss = bpy.context.active_object
    moss.scale = (1.1, 0.85, 1.0)
    moss.data.materials.append(moss_mat)

    export_asset_glb("environment/rocks/moss_rock.glb")

def make_pebbles():
    clear_scene()
    mat = create_pbr_mat("PebbleStone", (0.58, 0.55, 0.52, 1.0), roughness=0.7)

    for offset in [(0, 0, 0.1), (0.25, 0.15, 0.08), (-0.2, 0.1, 0.09)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.15, location=offset)
        p = bpy.context.active_object
        p.scale = (1.2, 0.9, 0.7)
        p.data.materials.append(mat)

    export_asset_glb("environment/rocks/pebbles.glb")

def make_floating_island_base():
    clear_scene()
    grass_mat = create_pbr_mat("IslandGrass", (0.42, 0.72, 0.4, 1.0), roughness=0.6)
    rock_mat = create_pbr_mat("IslandRock", (0.48, 0.4, 0.35, 1.0), roughness=0.85)

    # Top grassy plateau
    bpy.ops.mesh.primitive_cylinder_add(radius=4.5, depth=0.8, location=(0, 0, 0))
    plateau = bpy.context.active_object
    plateau.scale = (1.1, 0.9, 1.0)
    plateau.data.materials.append(grass_mat)

    # Subterranean conical rock underbelly
    bpy.ops.mesh.primitive_cone_add(radius1=4.3, depth=5.5, location=(0, 0, -2.8))
    underbelly = bpy.context.active_object
    underbelly.rotation_euler = (math.pi, 0, 0)
    underbelly.scale = (1.05, 0.88, 1.0)
    underbelly.data.materials.append(rock_mat)

    export_asset_glb("environment/islands/floating_island_base.glb")

# -------------------------------------------------------------
# 4. BRIDGES & ARCHITECTURE
# -------------------------------------------------------------
def make_bridge_plank():
    clear_scene()
    wood_mat = create_pbr_mat("BridgeWood", (0.52, 0.36, 0.24, 1.0), roughness=0.75)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.05))
    plank = bpy.context.active_object
    plank.scale = (2.4, 0.55, 0.1)
    plank.data.materials.append(wood_mat)
    export_asset_glb("environment/bridges/bridge_plank.glb")

def make_rope_post():
    clear_scene()
    wood_mat = create_pbr_mat("PostWood", (0.44, 0.3, 0.2, 1.0), roughness=0.8)
    rope_mat = create_pbr_mat("RopeFiber", (0.62, 0.52, 0.38, 1.0), roughness=0.9)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=1.1, location=(0, 0, 0.55))
    post = bpy.context.active_object
    post.data.materials.append(wood_mat)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.03, location=(0, 0, 0.85))
    rope = bpy.context.active_object
    rope.data.materials.append(rope_mat)

    export_asset_glb("environment/bridges/rope_post.glb")

def make_stone_pillar():
    clear_scene()
    stone_mat = create_pbr_mat("PillarStone", (0.55, 0.52, 0.5, 1.0), roughness=0.75)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=3.2, location=(0, 0, 1.6))
    pillar = bpy.context.active_object
    pillar.data.materials.append(stone_mat)

    bpy.ops.mesh.primitive_cube_add(size=1.1, location=(0, 0, 3.25))
    cap = bpy.context.active_object
    cap.scale = (1.0, 1.0, 0.2)
    cap.data.materials.append(stone_mat)

    export_asset_glb("environment/architecture/stone_pillar.glb")

def make_crystal_pedestal():
    clear_scene()
    stone_mat = create_pbr_mat("PedestalStone", (0.48, 0.45, 0.46, 1.0), roughness=0.7)
    crystal_mat = create_pbr_mat("PedestalCrystal", (0.2, 0.85, 0.95, 1.0), roughness=0.15, emission_color=(0.1, 0.9, 1.0, 1.0), emission_strength=1.5)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=1.0, location=(0, 0, 0.5))
    base = bpy.context.active_object
    base.data.materials.append(stone_mat)

    bpy.ops.mesh.primitive_cone_add(radius1=0.3, depth=0.8, location=(0, 0, 1.4))
    crystal = bpy.context.active_object
    crystal.data.materials.append(crystal_mat)

    export_asset_glb("environment/architecture/crystal_pedestal.glb")

def make_ancient_archway():
    clear_scene()
    stone_mat = create_pbr_mat("ArchStone", (0.52, 0.5, 0.48, 1.0), roughness=0.8)

    # Left pillar
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.8, 0, 2.2))
    p1 = bpy.context.active_object
    p1.scale = (0.6, 0.6, 4.4)
    p1.data.materials.append(stone_mat)

    # Right pillar
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.8, 0, 2.2))
    p2 = bpy.context.active_object
    p2.scale = (0.6, 0.6, 4.4)
    p2.data.materials.append(stone_mat)

    # Top beam
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 4.6))
    beam = bpy.context.active_object
    beam.scale = (4.4, 0.8, 0.7)
    beam.data.materials.append(stone_mat)

    export_asset_glb("environment/architecture/ancient_archway.glb")

def make_cozy_gazebo():
    clear_scene()
    wood_mat = create_pbr_mat("GazeboWood", (0.5, 0.35, 0.22, 1.0), roughness=0.7)
    roof_mat = create_pbr_mat("GazeboRoof", (0.85, 0.45, 0.4, 1.0), roughness=0.5)

    # 4 corner posts
    for x in [-1.5, 1.5]:
        for y in [-1.5, 1.5]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=3.0, location=(x, y, 1.5))
            post = bpy.context.active_object
            post.data.materials.append(wood_mat)

    # Domed roof
    bpy.ops.mesh.primitive_cone_add(radius1=2.4, depth=1.4, location=(0, 0, 3.7))
    roof = bpy.context.active_object
    roof.data.materials.append(roof_mat)

    export_asset_glb("environment/architecture/cozy_gazebo.glb")

def make_magical_lantern():
    clear_scene()
    brass_mat = create_pbr_mat("LanternBrass", (0.88, 0.72, 0.3, 1.0), roughness=0.3, metallic=0.9)
    glow_mat = create_pbr_mat("LanternGlow", (1.0, 0.88, 0.4, 1.0), roughness=0.1, emission_color=(1.0, 0.85, 0.4, 1.0), emission_strength=2.0)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.4, location=(0, 0, 0.2))
    cage = bpy.context.active_object
    cage.data.materials.append(brass_mat)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, 0, 0.2))
    crystal = bpy.context.active_object
    crystal.data.materials.append(glow_mat)

    export_asset_glb("environment/architecture/magical_lantern.glb")

def make_heart_gate():
    clear_scene()
    stone_mat = create_pbr_mat("HeartGateStone", (0.56, 0.54, 0.52, 1.0), roughness=0.8)
    heart_mat = create_pbr_mat("HeartGateGlow", (0.95, 0.45, 0.65, 1.0), roughness=0.2, emission_color=(0.95, 0.45, 0.65, 1.0), emission_strength=1.5)

    # Arch columns
    bpy.ops.mesh.primitive_cylinder_add(radius=0.7, depth=5.5, location=(-2.6, 0, 2.75))
    col_l = bpy.context.active_object
    col_l.data.materials.append(stone_mat)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.7, depth=5.5, location=(2.6, 0, 2.75))
    col_r = bpy.context.active_object
    col_r.data.materials.append(stone_mat)

    # Arch lintel
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 5.75))
    lintel = bpy.context.active_object
    lintel.scale = (6.2, 1.2, 0.9)
    lintel.data.materials.append(stone_mat)

    # Central heart emblem
    bpy.ops.mesh.primitive_torus_add(major_radius=0.9, minor_radius=0.2, location=(0, 0, 4.4))
    heart = bpy.context.active_object
    heart.scale = (1.0, 0.4, 1.2)
    heart.data.materials.append(heart_mat)

    export_asset_glb("environment/architecture/heart_gate.glb")

def main():
    print("=== Generating Environment Asset Library ===")
    make_fantasy_tree()
    make_willow_tree()
    make_flowering_tree()
    make_sapling()

    make_grass_tuft()
    make_fern()
    make_daisy()
    make_lavender()
    make_fairy_mushroom()

    make_cliff_rock()
    make_moss_rock()
    make_pebbles()
    make_floating_island_base()

    make_bridge_plank()
    make_rope_post()
    make_stone_pillar()
    make_crystal_pedestal()
    make_ancient_archway()
    make_cozy_gazebo()
    make_magical_lantern()
    make_heart_gate()

    # Save a master environment .blend
    sources_dir = os.path.abspath("tools/blender/sources")
    os.makedirs(sources_dir, exist_ok=True)
    blend_path = os.path.join(sources_dir, "environment.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[Blender] Saved master environment source: {blend_path}")

if __name__ == "__main__":
    main()
