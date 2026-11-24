"""
Together Apart — Studio Character Turnaround Renderer (Blender 5.3)
Renders multi-angle turnarounds, face close-ups, and detail shots for Lumi and Nova masters.
"""

import bpy
import math
import os
from mathutils import Vector

def setup_studio_lighting():
    # Remove existing lights/cameras
    for obj in list(bpy.data.objects):
        if obj.type in ('LIGHT', 'CAMERA'):
            bpy.data.objects.remove(obj, do_unlink=True)

    # Key light (warm golden sun/spot)
    key_data = bpy.data.lights.new(name="KeyLight", type='AREA')
    key_data.energy = 85.0
    key_data.size = 2.0
    key_data.color = (1.0, 0.94, 0.88)
    key_obj = bpy.data.objects.new("KeyLight", key_data)
    bpy.context.scene.collection.objects.link(key_obj)
    key_obj.location = (2.2, -2.6, 2.8)
    key_obj.rotation_euler = (math.radians(48), math.radians(12), math.radians(40))

    # Fill light (soft lavender/blue)
    fill_data = bpy.data.lights.new(name="FillLight", type='AREA')
    fill_data.energy = 40.0
    fill_data.size = 3.0
    fill_data.color = (0.75, 0.85, 1.0)
    fill_obj = bpy.data.objects.new("FillLight", fill_data)
    bpy.context.scene.collection.objects.link(fill_obj)
    fill_obj.location = (-2.5, -2.2, 2.0)
    fill_obj.rotation_euler = (math.radians(45), math.radians(-10), math.radians(-50))

    # Rim light (crisp silhouette separation)
    rim_data = bpy.data.lights.new(name="RimLight", type='SPOT')
    rim_data.energy = 120.0
    rim_data.spot_size = math.radians(65)
    rim_data.color = (1.0, 0.96, 0.82)
    rim_obj = bpy.data.objects.new("RimLight", rim_data)
    bpy.context.scene.collection.objects.link(rim_obj)
    rim_obj.location = (0, 3.2, 3.0)
    rim_obj.rotation_euler = (math.radians(-45), 0, math.radians(180))

    # Ground shadow catcher / soft circular pedestal
    bpy.ops.mesh.primitive_cylinder_add(radius=1.6, depth=0.08, location=(0, 0, -0.04))
    pedestal = bpy.context.active_object
    pedestal.name = "StudioPedestal"
    mat_ped = bpy.data.materials.new("PedestalMat")
    if mat_ped.node_tree:
        bsdf = mat_ped.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.16, 0.17, 0.22, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.8
    pedestal.data.materials.append(mat_ped)

def create_camera(name, location, rotation_euler, lens=65):
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens
    cam_obj = bpy.data.objects.new(name, cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location = location
    cam_obj.rotation_euler = rotation_euler
    return cam_obj

def render_character_views(char_name, blend_file, output_dir):
    print(f"\n==========================================")
    print(f"RENDERING STUDIO TURNAROUNDS FOR {char_name.upper()}")
    print(f"==========================================")
    bpy.ops.wm.open_mainfile(filepath=blend_file)

    setup_studio_lighting()

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1080
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    # World background
    world = scene.world or bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.07, 0.08, 0.12, 1.0)
        bg.inputs['Strength'].default_value = 0.8

    os.makedirs(output_dir, exist_ok=True)

    # 1. Front 3/4 (Hero View)
    cam_hero = create_camera("Cam_Hero", (1.6, -2.4, 1.45), (math.radians(72), 0, math.radians(34)), lens=60)
    scene.camera = cam_hero
    hero_path = os.path.join(output_dir, f"{char_name.lower()}_front_34.png")
    scene.render.filepath = hero_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {hero_path}")

    # 2. Front Turnaround View
    cam_front = create_camera("Cam_Front", (0, -2.8, 1.15), (math.radians(82), 0, 0), lens=65)
    scene.camera = cam_front
    front_path = os.path.join(output_dir, f"{char_name.lower()}_turnaround_front.png")
    scene.render.filepath = front_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {front_path}")

    # 3. Side Turnaround View
    cam_side = create_camera("Cam_Side", (2.8, 0, 1.15), (math.radians(82), 0, math.radians(90)), lens=65)
    scene.camera = cam_side
    side_path = os.path.join(output_dir, f"{char_name.lower()}_turnaround_side.png")
    scene.render.filepath = side_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {side_path}")

    # 4. Back Turnaround View
    cam_back = create_camera("Cam_Back", (0, 2.8, 1.15), (math.radians(82), 0, math.radians(180)), lens=65)
    scene.camera = cam_back
    back_path = os.path.join(output_dir, f"{char_name.lower()}_turnaround_back.png")
    scene.render.filepath = back_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {back_path}")

    # 5. Face & Expression Close-up
    cam_face = create_camera("Cam_Face", (0.35, -1.25, 1.48), (math.radians(84), 0, math.radians(16)), lens=85)
    scene.camera = cam_face
    face_path = os.path.join(output_dir, f"{char_name.lower()}_face_closeup.png")
    scene.render.filepath = face_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {face_path}")

def main():
    root = os.path.abspath(".")
    out_dir = os.path.join(root, "screenshots", "phase2.6")
    os.makedirs(out_dir, exist_ok=True)

    lumi_blend = os.path.join(root, "tools", "blender", "sources", "lumi_reference_master.blend")
    nova_blend = os.path.join(root, "tools", "blender", "sources", "nova_reference_master.blend")

    render_character_views("lumi", lumi_blend, out_dir)
    render_character_views("nova", nova_blend, out_dir)
    print("\n>>> ALL CHARACTER VIEWS RENDERED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    main()
