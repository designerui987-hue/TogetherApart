"""
Together Apart — Automated Character Rigging and Animation Generator
Generates original, high-quality stylized 3D models for Lumi and Nova with armatures,
proper vertex weights, PBR materials, and 14 animation actions.
Exports .blend sources and production .glb files.
"""

import bpy
import math
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, base_color, roughness=0.5, metallic=0.0, emission_color=(0,0,0,1), emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission_color
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        if 'Alpha' in bsdf.inputs and alpha < 1.0:
            bsdf.inputs['Alpha'].default_value = alpha
            mat.blend_method = 'BLEND'
    return mat

def create_humanoid_armature(char_name):
    arm_data = bpy.data.armatures.new(f"{char_name}_ArmatureData")
    arm_obj = bpy.data.objects.new(f"{char_name}_Armature", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')

    edit_bones = arm_data.edit_bones

    # Root
    root = edit_bones.new('Root')
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.1)

    # Hips
    hips = edit_bones.new('Hips')
    hips.head = (0, 0, 0.6)
    hips.tail = (0, 0, 0.8)
    hips.parent = root

    # Spine
    spine = edit_bones.new('Spine')
    spine.head = (0, 0, 0.8)
    spine.tail = (0, 0, 1.0)
    spine.parent = hips

    # Chest
    chest = edit_bones.new('Chest')
    chest.head = (0, 0, 1.0)
    chest.tail = (0, 0, 1.15)
    chest.parent = spine

    # Neck & Head
    neck = edit_bones.new('Neck')
    neck.head = (0, 0, 1.15)
    neck.tail = (0, 0, 1.25)
    neck.parent = chest

    head = edit_bones.new('Head')
    head.head = (0, 0, 1.25)
    head.tail = (0, 0, 1.6)
    head.parent = neck

    # Left Arm
    uarm_l = edit_bones.new('UpperArm.L')
    uarm_l.head = (0.22, 0, 1.1)
    uarm_l.tail = (0.42, 0, 0.95)
    uarm_l.parent = chest

    farm_l = edit_bones.new('Forearm.L')
    farm_l.head = (0.42, 0, 0.95)
    farm_l.tail = (0.6, 0, 0.8)
    farm_l.parent = uarm_l

    hand_l = edit_bones.new('Hand.L')
    hand_l.head = (0.6, 0, 0.8)
    hand_l.tail = (0.7, 0, 0.72)
    hand_l.parent = farm_l

    # Right Arm
    uarm_r = edit_bones.new('UpperArm.R')
    uarm_r.head = (-0.22, 0, 1.1)
    uarm_r.tail = (-0.42, 0, 0.95)
    uarm_r.parent = chest

    farm_r = edit_bones.new('Forearm.R')
    farm_r.head = (-0.42, 0, 0.95)
    farm_r.tail = (-0.6, 0, 0.8)
    farm_r.parent = uarm_r

    hand_r = edit_bones.new('Hand.R')
    hand_r.head = (-0.6, 0, 0.8)
    hand_r.tail = (-0.7, 0, 0.72)
    hand_r.parent = farm_r

    # Left Leg
    thigh_l = edit_bones.new('Thigh.L')
    thigh_l.head = (0.15, 0, 0.6)
    thigh_l.tail = (0.15, 0, 0.32)
    thigh_l.parent = hips

    shin_l = edit_bones.new('Shin.L')
    shin_l.head = (0.15, 0, 0.32)
    shin_l.tail = (0.15, 0, 0.1)
    shin_l.parent = thigh_l

    foot_l = edit_bones.new('Foot.L')
    foot_l.head = (0.15, 0, 0.1)
    foot_l.tail = (0.15, 0.16, 0.0)
    foot_l.parent = shin_l

    # Right Leg
    thigh_r = edit_bones.new('Thigh.R')
    thigh_r.head = (-0.15, 0, 0.6)
    thigh_r.tail = (-0.15, 0, 0.32)
    thigh_r.parent = hips

    shin_r = edit_bones.new('Shin.R')
    shin_r.head = (-0.15, 0, 0.32)
    shin_r.tail = (-0.15, 0, 0.1)
    shin_r.parent = thigh_r

    foot_r = edit_bones.new('Foot.R')
    foot_r.head = (-0.15, 0, 0.1)
    foot_r.tail = (-0.15, 0.16, 0.0)
    foot_r.parent = shin_r

    # Character-specific bones
    if char_name == 'Lumi':
        wing_l = edit_bones.new('Wing.L')
        wing_l.head = (0.1, -0.1, 1.05)
        wing_l.tail = (0.45, -0.3, 1.35)
        wing_l.parent = chest

        wing_r = edit_bones.new('Wing.R')
        wing_r.head = (-0.1, -0.1, 1.05)
        wing_r.tail = (-0.45, -0.3, 1.35)
        wing_r.parent = chest

        scarf = edit_bones.new('Scarf')
        scarf.head = (0, -0.12, 1.12)
        scarf.tail = (0.15, -0.4, 0.8)
        scarf.parent = chest
    else:
        crystal_l = edit_bones.new('Crystal.L')
        crystal_l.head = (0.35, -0.1, 1.25)
        crystal_l.tail = (0.35, -0.1, 1.45)
        crystal_l.parent = chest

        crystal_r = edit_bones.new('Crystal.R')
        crystal_r.head = (-0.35, -0.1, 1.25)
        crystal_r.tail = (-0.35, -0.1, 1.45)
        crystal_r.parent = chest

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj

def add_part_mesh(name, primitive_type, location, scale, material, bone_name, armature, **kwargs):
    """Create a submesh, assign material, vertex group, and parent to armature with modifier."""
    if primitive_type == 'cube':
        bpy.ops.mesh.primitive_cube_add(location=location, scale=scale)
    elif primitive_type == 'cylinder':
        r = kwargs.get('radius', 0.2)
        d = kwargs.get('depth', 0.5)
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=location, scale=scale)
    elif primitive_type == 'uv_sphere':
        r = kwargs.get('radius', 0.3)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=location, scale=scale)
    elif primitive_type == 'cone':
        r1 = kwargs.get('radius1', 0.3)
        d = kwargs.get('depth', 0.5)
        bpy.ops.mesh.primitive_cone_add(radius1=r1, depth=d, location=location, scale=scale)

    obj = bpy.context.active_object
    obj.name = name
    if material:
        obj.data.materials.append(material)

    # Vertex group for bone weighting
    vg = obj.vertex_groups.new(name=bone_name)
    all_verts = [v.index for v in obj.data.vertices]
    vg.add(all_verts, 1.0, 'REPLACE')

    # Add armature modifier
    mod = obj.modifiers.new(name="ArmatureMod", type='ARMATURE')
    mod.object = armature
    obj.parent = armature

    return obj

def build_lumi(armature):
    skin_mat = create_pbr_material("Lumi_Skin", (0.98, 0.88, 0.82, 1.0), roughness=0.5)
    hair_mat = create_pbr_material("Lumi_Hair", (0.95, 0.55, 0.62, 1.0), roughness=0.4) # Coral pink
    dress_mat = create_pbr_material("Lumi_Dress", (0.98, 0.93, 0.87, 1.0), roughness=0.35) # Cream
    coral_trim_mat = create_pbr_material("Lumi_Trim", (0.95, 0.45, 0.55, 1.0), roughness=0.3)
    wing_mat = create_pbr_material("Lumi_Wing", (0.95, 0.8, 0.9, 0.65), roughness=0.15, emission_color=(0.9, 0.7, 0.85, 1), emission_strength=0.8, alpha=0.65)
    gold_mat = create_pbr_material("Lumi_Gold", (0.96, 0.8, 0.4, 1.0), roughness=0.25, metallic=0.85)

    # Head & Face
    add_part_mesh("Lumi_Head", 'uv_sphere', (0, 0, 1.35), (0.34, 0.32, 0.32), skin_mat, 'Head', armature, radius=1.0)
    # Hair volume & side curls
    add_part_mesh("Lumi_HairTop", 'uv_sphere', (0, -0.05, 1.48), (0.38, 0.36, 0.3), hair_mat, 'Head', armature, radius=1.0)
    add_part_mesh("Lumi_HairPonytail", 'cone', (0, -0.32, 1.42), (0.22, 0.22, 0.35), hair_mat, 'Head', armature, radius1=0.8, depth=1.2)
    add_part_mesh("Lumi_HairCurlL", 'cylinder', (0.32, 0.05, 1.25), (0.08, 0.08, 0.28), hair_mat, 'Head', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_HairCurlR", 'cylinder', (-0.32, 0.05, 1.25), (0.08, 0.08, 0.28), hair_mat, 'Head', armature, radius=1.0, depth=1.0)

    # Eyes
    eye_mat = create_pbr_material("Lumi_Eye", (0.2, 0.12, 0.1, 1.0), roughness=0.1)
    add_part_mesh("Lumi_EyeL", 'uv_sphere', (0.12, 0.28, 1.35), (0.07, 0.04, 0.09), eye_mat, 'Head', armature, radius=1.0)
    add_part_mesh("Lumi_EyeR", 'uv_sphere', (-0.12, 0.28, 1.35), (0.07, 0.04, 0.09), eye_mat, 'Head', armature, radius=1.0)

    # Torso & Dress
    add_part_mesh("Lumi_Torso", 'cylinder', (0, 0, 1.05), (0.18, 0.14, 0.2), dress_mat, 'Chest', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_Brooch", 'uv_sphere', (0, 0.16, 1.12), (0.05, 0.04, 0.05), coral_trim_mat, 'Chest', armature, radius=1.0)
    add_part_mesh("Lumi_Skirt", 'cone', (0, 0, 0.8), (0.34, 0.3, 0.28), dress_mat, 'Hips', armature, radius1=1.0, depth=1.0)
    add_part_mesh("Lumi_SkirtTrim", 'cylinder', (0, 0, 0.68), (0.35, 0.31, 0.04), coral_trim_mat, 'Hips', armature, radius=1.0, depth=1.0)

    # Arms & Hands
    add_part_mesh("Lumi_UpperArmL", 'cylinder', (0.28, 0, 1.02), (0.07, 0.07, 0.16), dress_mat, 'UpperArm.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_ForearmL", 'cylinder', (0.5, 0, 0.88), (0.06, 0.06, 0.16), skin_mat, 'Forearm.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_HandL", 'uv_sphere', (0.64, 0, 0.76), (0.07, 0.06, 0.07), skin_mat, 'Hand.L', armature, radius=1.0)

    add_part_mesh("Lumi_UpperArmR", 'cylinder', (-0.28, 0, 1.02), (0.07, 0.07, 0.16), dress_mat, 'UpperArm.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_ForearmR", 'cylinder', (-0.5, 0, 0.88), (0.06, 0.06, 0.16), skin_mat, 'Forearm.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_HandR", 'uv_sphere', (-0.64, 0, 0.76), (0.07, 0.06, 0.07), skin_mat, 'Hand.R', armature, radius=1.0)

    # Legs & Boots
    boot_mat = create_pbr_material("Lumi_Boot", (0.5, 0.28, 0.22, 1.0), roughness=0.4)
    add_part_mesh("Lumi_LegL", 'cylinder', (0.15, 0, 0.35), (0.08, 0.08, 0.25), dress_mat, 'Shin.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_BootL", 'cube', (0.15, 0.06, 0.08), (0.09, 0.16, 0.08), boot_mat, 'Foot.L', armature)

    add_part_mesh("Lumi_LegR", 'cylinder', (-0.15, 0, 0.35), (0.08, 0.08, 0.25), dress_mat, 'Shin.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_BootR", 'cube', (-0.15, 0.06, 0.08), (0.09, 0.16, 0.08), boot_mat, 'Foot.R', armature)

    # Wings & Scarf
    add_part_mesh("Lumi_WingL", 'cylinder', (0.28, -0.18, 1.22), (0.22, 0.02, 0.32), wing_mat, 'Wing.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_WingR", 'cylinder', (-0.28, -0.18, 1.22), (0.22, 0.02, 0.32), wing_mat, 'Wing.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Lumi_Scarf", 'cylinder', (0.08, -0.22, 0.95), (0.08, 0.04, 0.35), gold_mat, 'Scarf', armature, radius=1.0, depth=1.0)

def build_nova(armature):
    skin_mat = create_pbr_material("Nova_Skin", (0.82, 0.62, 0.46, 1.0), roughness=0.55) # Elven golden-brown
    hair_mat = create_pbr_material("Nova_Hair", (0.2, 0.72, 0.82, 1.0), roughness=0.35) # Turquoise
    tunic_mat = create_pbr_material("Nova_Tunic", (0.12, 0.52, 0.62, 1.0), roughness=0.45) # Teal
    leather_mat = create_pbr_material("Nova_Leather", (0.35, 0.22, 0.15, 1.0), roughness=0.6)
    gold_mat = create_pbr_material("Nova_Gold", (0.95, 0.75, 0.25, 1.0), roughness=0.25, metallic=0.9)
    glow_mat = create_pbr_material("Nova_Glow", (0.0, 0.88, 1.0, 1.0), roughness=0.1, emission_color=(0, 0.9, 1, 1), emission_strength=1.2)

    # Head & Face
    add_part_mesh("Nova_Head", 'uv_sphere', (0, 0, 1.35), (0.33, 0.31, 0.32), skin_mat, 'Head', armature, radius=1.0)
    # Elven pointed ears
    add_part_mesh("Nova_EarL", 'cone', (0.36, 0.02, 1.38), (0.08, 0.05, 0.2), skin_mat, 'Head', armature, radius1=1.0, depth=1.0)
    add_part_mesh("Nova_EarR", 'cone', (-0.36, 0.02, 1.38), (0.08, 0.05, 0.2), skin_mat, 'Head', armature, radius1=1.0, depth=1.0)

    # Hair crest & Helmet
    add_part_mesh("Nova_HairCrest", 'cone', (0, 0.08, 1.62), (0.16, 0.24, 0.35), hair_mat, 'Head', armature, radius1=1.0, depth=1.0)
    add_part_mesh("Nova_HelmetBand", 'cylinder', (0, 0, 1.45), (0.35, 0.33, 0.06), gold_mat, 'Head', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_HelmetGem", 'uv_sphere', (0, 0.34, 1.48), (0.06, 0.05, 0.06), glow_mat, 'Head', armature, radius=1.0)

    # Eyes
    eye_mat = create_pbr_material("Nova_Eye", (0.1, 0.45, 0.6, 1.0), roughness=0.1)
    add_part_mesh("Nova_EyeL", 'uv_sphere', (0.12, 0.27, 1.35), (0.07, 0.04, 0.09), eye_mat, 'Head', armature, radius=1.0)
    add_part_mesh("Nova_EyeR", 'uv_sphere', (-0.12, 0.27, 1.35), (0.07, 0.04, 0.09), eye_mat, 'Head', armature, radius=1.0)

    # Torso & Belt
    add_part_mesh("Nova_Torso", 'cylinder', (0, 0, 1.05), (0.2, 0.16, 0.22), tunic_mat, 'Chest', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_Belt", 'cylinder', (0, 0, 0.88), (0.21, 0.17, 0.06), leather_mat, 'Hips', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_BeltBuckle", 'cylinder', (0, 0.18, 0.88), (0.07, 0.02, 0.07), gold_mat, 'Hips', armature, radius=1.0, depth=1.0)

    # Arms & Oversized Kinetic Gauntlets
    add_part_mesh("Nova_UpperArmL", 'cylinder', (0.28, 0, 1.02), (0.08, 0.08, 0.16), tunic_mat, 'UpperArm.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_GauntletL", 'cylinder', (0.52, 0, 0.86), (0.14, 0.14, 0.22), gold_mat, 'Forearm.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_GauntletGlowL", 'cylinder', (0.52, 0.05, 0.86), (0.145, 0.11, 0.08), glow_mat, 'Forearm.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_HandL", 'uv_sphere', (0.66, 0, 0.74), (0.12, 0.11, 0.11), leather_mat, 'Hand.L', armature, radius=1.0)

    add_part_mesh("Nova_UpperArmR", 'cylinder', (-0.28, 0, 1.02), (0.08, 0.08, 0.16), tunic_mat, 'UpperArm.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_GauntletR", 'cylinder', (-0.52, 0, 0.86), (0.14, 0.14, 0.22), gold_mat, 'Forearm.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_GauntletGlowR", 'cylinder', (-0.52, 0.05, 0.86), (0.145, 0.11, 0.08), glow_mat, 'Forearm.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_HandR", 'uv_sphere', (-0.66, 0, 0.74), (0.12, 0.11, 0.11), leather_mat, 'Hand.R', armature, radius=1.0)

    # Legs & Boots
    add_part_mesh("Nova_LegL", 'cylinder', (0.16, 0, 0.35), (0.09, 0.09, 0.25), tunic_mat, 'Shin.L', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_BootL", 'cube', (0.16, 0.06, 0.08), (0.1, 0.17, 0.08), leather_mat, 'Foot.L', armature)

    add_part_mesh("Nova_LegR", 'cylinder', (-0.16, 0, 0.35), (0.09, 0.09, 0.25), tunic_mat, 'Shin.R', armature, radius=1.0, depth=1.0)
    add_part_mesh("Nova_BootR", 'cube', (-0.16, 0.06, 0.08), (0.1, 0.17, 0.08), leather_mat, 'Foot.R', armature)

    # Orbiting Crystals
    add_part_mesh("Nova_CrystalL", 'cone', (0.35, -0.1, 1.35), (0.08, 0.08, 0.16), glow_mat, 'Crystal.L', armature, radius1=1.0, depth=1.0)
    add_part_mesh("Nova_CrystalR", 'cone', (-0.35, -0.1, 1.35), (0.08, 0.08, 0.16), glow_mat, 'Crystal.R', armature, radius1=1.0, depth=1.0)

def keyframe_bone(armature, bone_name, prop_name, value, frame):
    pb = armature.pose.bones.get(bone_name)
    if not pb:
        return
    if prop_name == 'location':
        pb.location = value
        pb.keyframe_insert(data_path="location", frame=frame)
    elif prop_name == 'rotation_euler':
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = value
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)

def add_animation_action(armature, action_name, keyframes_func):
    """Create a new action, evaluate keyframes, and push to NLA strip so GLTF exports all actions."""
    action = bpy.data.actions.new(name=action_name)
    if not armature.animation_data:
        armature.animation_data_create()
    armature.animation_data.action = action

    # Run custom keyframe function
    keyframes_func(armature)

    # Push to NLA so glTF exporter finds all actions
    track = armature.animation_data.nla_tracks.new()
    track.name = action_name
    track.strips.new(action_name, int(action.frame_range[0]), action)

def build_actions(armature, char_name):
    """Build all 14 required animation actions."""

    # 1. Idle (60 frames)
    def anim_idle(arm):
        for f in [1, 30, 60]:
            bob = 0.03 * math.sin((f / 60.0) * math.pi * 2)
            keyframe_bone(arm, 'Hips', 'location', (0, 0, bob), f)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (bob * 0.5, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0.1 + bob), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -0.1 - bob), f)
            if char_name == 'Lumi':
                wing_sway = 0.25 * math.sin((f / 30.0) * math.pi * 2)
                keyframe_bone(arm, 'Wing.L', 'rotation_euler', (0, wing_sway, 0), f)
                keyframe_bone(arm, 'Wing.R', 'rotation_euler', (0, -wing_sway, 0), f)
    add_animation_action(armature, 'Idle', anim_idle)

    # 2. Walk (30 frames loop)
    def anim_walk(arm):
        for f in [1, 8, 15, 23, 30]:
            phase = (f / 30.0) * math.pi * 2
            leg_l = 0.5 * math.sin(phase)
            leg_r = 0.5 * math.sin(phase + math.pi)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (leg_l, 0, 0), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (leg_r, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-leg_l * 0.7, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-leg_r * 0.7, 0, 0), f)
            keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.02 * math.sin(phase * 2)), f)
    add_animation_action(armature, 'Walk', anim_walk)

    # 3. Run (20 frames loop)
    def anim_run(arm):
        for f in [1, 5, 10, 15, 20]:
            phase = (f / 20.0) * math.pi * 2
            leg_l = 0.9 * math.sin(phase)
            leg_r = 0.9 * math.sin(phase + math.pi)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0.25, 0, 0), f)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (leg_l, 0, 0), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (leg_r, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-leg_l * 0.9, 0, 0.2), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-leg_r * 0.9, 0, -0.2), f)
            keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.05 * math.sin(phase * 2)), f)
    add_animation_action(armature, 'Run', anim_run)

    # 4. JumpStart (10 frames)
    def anim_jumpstart(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, -0.15), 5) # Squash
        keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (0.35, 0, 0), 5)
        keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (0.35, 0, 0), 5)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.2), 10) # Liftoff
    add_animation_action(armature, 'JumpStart', anim_jumpstart)

    # 5. JumpLoop (20 frames)
    def anim_jumploop(arm):
        for f in [1, 10, 20]:
            keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.15), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0.6), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -0.6), f)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (-0.2, 0, 0), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (-0.2, 0, 0), f)
    add_animation_action(armature, 'JumpLoop', anim_jumploop)

    # 6. Fall (20 frames)
    def anim_fall(arm):
        for f in [1, 20]:
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 1.1), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -1.1), f)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (0.3, 0, 0.1), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (0.3, 0, -0.1), f)
    add_animation_action(armature, 'Fall', anim_fall)

    # 7. Land (15 frames)
    def anim_land(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, -0.18), 4) # Impact squash
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.2, 0, 0), 4)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0), 15) # Recovery
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0, 0, 0), 15)
    add_animation_action(armature, 'Land', anim_land)

    # 8. Ability (30 frames)
    def anim_ability(arm):
        if char_name == 'Lumi':
            # Dual arm raise flourish
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-1.4, 0, 0.5), 15)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.4, 0, -0.5), 15)
            keyframe_bone(arm, 'Head', 'rotation_euler', (-0.4, 0, 0), 15)
        else:
            # Kinetic thrust punch
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.5, 0, 0), 12)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0, -0.4, 0), 12)
        # Settle back to rest at frame 30
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0), 30)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 30)
    add_animation_action(armature, 'Ability', anim_ability)

    # 9. HighFive (25 frames)
    def anim_highfive(arm):
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.8, 0, 0.2), 12) # Raise arm high
        keyframe_bone(arm, 'Forearm.R', 'rotation_euler', (0.4, 0, 0), 12)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 25)
    add_animation_action(armature, 'HighFive', anim_highfive)

    # 10. Wave (30 frames)
    def anim_wave(arm):
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.6, 0, 0.3), 8)
        keyframe_bone(arm, 'Forearm.R', 'rotation_euler', (0, 0.4, 0), 14)
        keyframe_bone(arm, 'Forearm.R', 'rotation_euler', (0, -0.4, 0), 20)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 30)
    add_animation_action(armature, 'Wave', anim_wave)

    # 11. Hug (35 frames)
    def anim_hug(arm):
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-0.8, 0, -0.5), 16)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-0.8, 0, 0.5), 16)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.15, 0, 0), 16)
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0), 35)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 35)
    add_animation_action(armature, 'Hug', anim_hug)

    # 12. Dance (40 frames loop)
    def anim_dance(arm):
        for f in [1, 10, 20, 30, 40]:
            p = (f / 40.0) * math.pi * 2
            sway = 0.2 * math.sin(p)
            keyframe_bone(arm, 'Hips', 'location', (sway * 0.4, 0, 0.03 * math.sin(p * 2)), f)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0, 0, -sway), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0.4 + sway), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -0.4 + sway), f)
    add_animation_action(armature, 'Dance', anim_dance)

    # 13. Celebrate (30 frames)
    def anim_celebrate(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.25), 14) # Jump
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-2.0, 0, 0.4), 14) # Fist pump
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-2.0, 0, -0.4), 14)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0), 30)
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0), 30)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 30)
    add_animation_action(armature, 'Celebrate', anim_celebrate)

    # 14. Respawn (30 frames)
    def anim_respawn(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, -0.3), 1)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.5, 0, 0), 1)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0), 25)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0, 0, 0), 25)
    add_animation_action(armature, 'Respawn', anim_respawn)

def generate_character(char_name):
    clear_scene()
    print(f"\n==========================================")
    print(f"Generating Character: {char_name}")
    print(f"==========================================")

    armature = create_humanoid_armature(char_name)

    if char_name == 'Lumi':
        build_lumi(armature)
    else:
        build_nova(armature)

    build_actions(armature, char_name)

    # Ensure output paths
    source_dir = os.path.abspath("tools/blender/sources")
    os.makedirs(source_dir, exist_ok=True)
    blend_path = os.path.join(source_dir, f"{char_name.lower()}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[Blender] Saved source: {blend_path}")

    # Select all objects for export
    bpy.ops.object.select_all(action='SELECT')
    out_dir = os.path.abspath(f"packages/client/public/assets/characters/{char_name.lower()}")
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, f"{char_name.lower()}.glb")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_attributes=True,
        export_animations=True
    )
    print(f"[Blender] Exported GLB: {glb_path} ({os.path.getsize(glb_path)} bytes)")

def main():
    generate_character('Lumi')
    generate_character('Nova')

if __name__ == "__main__":
    main()
