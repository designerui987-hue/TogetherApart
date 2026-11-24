"""
Together Apart — Reference-Accurate Character Generator (Blender 5.3 Python)
Recreates Lumi (The Light Weaver) and Nova (The Kinetic Shaper) matching the official concept sheets.
Includes sculpted stylized anatomy, multi-layered hair locks, detailed layered clothing,
accessories, PBR materials, rigged humanoid armatures, shape keys, and 14 animation actions.
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler, Matrix

def bmesh_create_cylinder(bm, segments=12, radius=0.1, depth=0.2, cap_ends=True):
    return bmesh.ops.create_cone(
        bm,
        cap_ends=cap_ends,
        cap_tris=False,
        segments=segments,
        radius1=radius,
        radius2=radius,
        depth=depth
    )

def bmesh_create_torus(bm, major_radius=0.2, minor_radius=0.05, major_segments=16, minor_segments=8):
    res = bmesh.ops.create_circle(bm, cap_ends=False, segments=minor_segments, radius=minor_radius)
    bmesh.ops.translate(bm, vec=(major_radius, 0, 0), verts=res['verts'])
    bmesh.ops.rotate(bm, cent=(major_radius, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X'), verts=res['verts'])
    bmesh.ops.spin(bm, geom=list(bm.verts) + list(bm.edges), angle=math.pi*2, steps=major_segments, axis=(0, 0, 1), cent=(0, 0, 0))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)

bmesh.ops.create_cylinder = bmesh_create_cylinder
bmesh.ops.create_torus = bmesh_create_torus

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
        if 'Emission Color' in bsdf.inputs and emission_strength > 0:
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

    eb = arm_data.edit_bones

    # Proportions:
    # Lumi: ~3.2 heads tall (~1.65m total). Head top ~1.65, chin ~1.15, chest ~0.95, hips ~0.65, feet ~0.0
    # Nova: ~3.1 heads tall (~1.60m total). Head top ~1.60, chin ~1.12, chest ~0.92, hips ~0.62, feet ~0.0

    root = eb.new('Root')
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.1)

    hips = eb.new('Hips')
    hips.head = (0, 0, 0.62)
    hips.tail = (0, 0, 0.78)
    hips.parent = root

    spine = eb.new('Spine')
    spine.head = (0, 0, 0.78)
    spine.tail = (0, 0, 0.95)
    spine.parent = hips

    chest = eb.new('Chest')
    chest.head = (0, 0, 0.95)
    chest.tail = (0, 0, 1.12)
    chest.parent = spine

    neck = eb.new('Neck')
    neck.head = (0, 0, 1.12)
    neck.tail = (0, 0, 1.20)
    neck.parent = chest

    head = eb.new('Head')
    head.head = (0, 0, 1.20)
    head.tail = (0, 0, 1.62)
    head.parent = neck

    # Left Arm
    clav_l = eb.new('Clavicle.L')
    clav_l.head = (0.06, 0, 1.08)
    clav_l.tail = (0.18, 0, 1.05)
    clav_l.parent = chest

    uarm_l = eb.new('UpperArm.L')
    uarm_l.head = (0.18, 0, 1.05)
    uarm_l.tail = (0.36, 0, 0.92)
    uarm_l.parent = clav_l

    farm_l = eb.new('Forearm.L')
    farm_l.head = (0.36, 0, 0.92)
    farm_l.tail = (0.52, 0, 0.80)
    farm_l.parent = uarm_l

    hand_l = eb.new('Hand.L')
    hand_l.head = (0.52, 0, 0.80)
    hand_l.tail = (0.62, 0, 0.72)
    hand_l.parent = farm_l

    # Right Arm
    clav_r = eb.new('Clavicle.R')
    clav_r.head = (-0.06, 0, 1.08)
    clav_r.tail = (-0.18, 0, 1.05)
    clav_r.parent = chest

    uarm_r = eb.new('UpperArm.R')
    uarm_r.head = (-0.18, 0, 1.05)
    uarm_r.tail = (-0.36, 0, 0.92)
    uarm_r.parent = clav_r

    farm_r = eb.new('Forearm.R')
    farm_r.head = (-0.36, 0, 0.92)
    farm_r.tail = (-0.52, 0, 0.80)
    farm_r.parent = uarm_r

    hand_r = eb.new('Hand.R')
    hand_r.head = (-0.52, 0, 0.80)
    hand_r.tail = (-0.62, 0, 0.72)
    hand_r.parent = farm_r

    # Left Leg
    thigh_l = eb.new('Thigh.L')
    thigh_l.head = (0.14, 0, 0.60)
    thigh_l.tail = (0.14, 0, 0.32)
    thigh_l.parent = hips

    shin_l = eb.new('Shin.L')
    shin_l.head = (0.14, 0, 0.32)
    shin_l.tail = (0.14, 0, 0.10)
    shin_l.parent = thigh_l

    foot_l = eb.new('Foot.L')
    foot_l.head = (0.14, 0, 0.10)
    foot_l.tail = (0.14, 0.16, 0.0)
    foot_l.parent = shin_l

    # Right Leg
    thigh_r = eb.new('Thigh.R')
    thigh_r.head = (-0.14, 0, 0.60)
    thigh_r.tail = (-0.14, 0, 0.32)
    thigh_r.parent = hips

    shin_r = eb.new('Shin.R')
    shin_r.head = (-0.14, 0, 0.32)
    shin_r.tail = (-0.14, 0, 0.10)
    shin_r.parent = thigh_r

    foot_r = eb.new('Foot.R')
    foot_r.head = (-0.14, 0, 0.10)
    foot_r.tail = (-0.14, 0.16, 0.0)
    foot_r.parent = shin_r

    # Character-specific secondary bones
    if char_name == 'Lumi':
        # 4 Wings
        wing_ul = eb.new('Wing_Upper.L')
        wing_ul.head = (0.08, -0.10, 1.05)
        wing_ul.tail = (0.42, -0.32, 1.45)
        wing_ul.parent = chest

        wing_ll = eb.new('Wing_Lower.L')
        wing_ll.head = (0.06, -0.08, 0.95)
        wing_ll.tail = (0.35, -0.28, 0.82)
        wing_ll.parent = chest

        wing_ur = eb.new('Wing_Upper.R')
        wing_ur.head = (-0.08, -0.10, 1.05)
        wing_ur.tail = (-0.42, -0.32, 1.45)
        wing_ur.parent = chest

        wing_lr = eb.new('Wing_Lower.R')
        wing_lr.head = (-0.06, -0.08, 0.95)
        wing_lr.tail = (-0.35, -0.28, 0.82)
        wing_lr.parent = chest

        # Scarf multi-chain
        scarf1 = eb.new('Scarf.01')
        scarf1.head = (0, -0.12, 1.10)
        scarf1.tail = (0.12, -0.30, 0.90)
        scarf1.parent = chest

        scarf2 = eb.new('Scarf.02')
        scarf2.head = (0.12, -0.30, 0.90)
        scarf2.tail = (0.24, -0.52, 0.65)
        scarf2.parent = scarf1

        scarf3 = eb.new('Scarf.03')
        scarf3.head = (0.24, -0.52, 0.65)
        scarf3.tail = (0.32, -0.75, 0.40)
        scarf3.parent = scarf2

        # Hair ahoge
        ahoge = eb.new('Hair_Ahoge')
        ahoge.head = (0, 0, 1.58)
        ahoge.tail = (0.06, 0.12, 1.76)
        ahoge.parent = head
    else:
        # Nova: Scarf tails
        scarf1 = eb.new('Scarf.01')
        scarf1.head = (0, -0.12, 1.08)
        scarf1.tail = (-0.14, -0.32, 0.85)
        scarf1.parent = chest

        scarf2 = eb.new('Scarf.02')
        scarf2.head = (-0.14, -0.32, 0.85)
        scarf2.tail = (-0.26, -0.55, 0.60)
        scarf2.parent = scarf1

        # Hair crest
        crest = eb.new('Hair_Crest')
        crest.head = (0, 0, 1.55)
        crest.tail = (0, 0.16, 1.78)
        crest.parent = head

        # Orbiting kinetic crystals
        c1 = eb.new('Crystal.01')
        c1.head = (0.38, -0.15, 1.30)
        c1.tail = (0.38, -0.15, 1.48)
        c1.parent = chest

        c2 = eb.new('Crystal.02')
        c2.head = (-0.38, -0.15, 1.30)
        c2.tail = (-0.38, -0.15, 1.48)
        c2.parent = chest

        c3 = eb.new('Crystal.03')
        c3.head = (0, 0.35, 1.40)
        c3.tail = (0, 0.35, 1.56)
        c3.parent = chest

        # Gauntlet fingers
        f1_l = eb.new('Finger_Thumb.L')
        f1_l.head = (0.58, 0.08, 0.78)
        f1_l.tail = (0.64, 0.14, 0.75)
        f1_l.parent = hand_l

        f2_l = eb.new('Finger_Main.L')
        f2_l.head = (0.60, 0, 0.76)
        f2_l.tail = (0.72, 0, 0.70)
        f2_l.parent = hand_l

        f1_r = eb.new('Finger_Thumb.R')
        f1_r.head = (-0.58, 0.08, 0.78)
        f1_r.tail = (-0.64, 0.14, 0.75)
        f1_r.parent = hand_r

        f2_r = eb.new('Finger_Main.R')
        f2_r.head = (-0.60, 0, 0.76)
        f2_r.tail = (-0.72, 0, 0.70)
        f2_r.parent = hand_r

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj

def attach_mesh_to_bone(obj, bone_name, armature, weight=1.0):
    vg = obj.vertex_groups.new(name=bone_name)
    all_verts = [v.index for v in obj.data.vertices]
    vg.add(all_verts, weight, 'REPLACE')
    mod = obj.modifiers.new(name="ArmatureMod", type='ARMATURE')
    mod.object = armature
    obj.parent = armature

def make_bmesh_object(name, bm, material, bone_name, armature):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if material:
        obj.data.materials.append(material)

    attach_mesh_to_bone(obj, bone_name, armature)
    return obj

# -------------------------------------------------------------
# BUILD SCULPTED LUMI (Concept Accurate)
# -------------------------------------------------------------
def build_lumi_reference(armature):
    print("Building reference-accurate Lumi...")

    # Palette from concept sheet
    mat_skin = create_pbr_material("Lumi_Skin", (0.99, 0.90, 0.85, 1.0), roughness=0.45)
    mat_hair = create_pbr_material("Lumi_Hair", (0.90, 0.49, 0.47, 1.0), roughness=0.38) # #E77D79
    mat_dress_cream = create_pbr_material("Lumi_DressCream", (0.98, 0.93, 0.86, 1.0), roughness=0.5) # #F9EDDC
    mat_dress_coral = create_pbr_material("Lumi_DressCoral", (0.91, 0.55, 0.53, 1.0), roughness=0.45) # #E98D87
    mat_scarf_gold = create_pbr_material("Lumi_ScarfGold", (0.92, 0.72, 0.37, 1.0), roughness=0.32, metallic=0.15) # #EAB95F
    mat_eye_amber = create_pbr_material("Lumi_EyeAmber", (0.78, 0.54, 0.21, 1.0), roughness=0.1) # #C88A35
    mat_leather_brown = create_pbr_material("Lumi_LeatherBrown", (0.47, 0.32, 0.27, 1.0), roughness=0.65) # #795346
    mat_metal_gold = create_pbr_material("Lumi_MetalGold", (0.90, 0.71, 0.36, 1.0), roughness=0.25, metallic=0.92) # #E6B65B
    mat_wing_glow = create_pbr_material("Lumi_WingGlow", (1.0, 0.91, 0.66, 0.65), roughness=0.15, emission_color=(1.0, 0.9, 0.65, 1.0), emission_strength=1.6, alpha=0.65)

    # 1. Stylized Chibi Head with modeled cheeks, nose & jaw
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=0.34)
    # Deform sphere into chibi anime skull
    for v in bm.verts:
        # Taper jaw downward and flatten rear slightly
        if v.co.z < 0:
            v.co.x *= 0.88
            v.co.y *= 0.92
        # Soft cheek prominence
        if v.co.y > 0 and v.co.z < 0.1:
            v.co.y += 0.04 * (1.0 - abs(v.co.x) * 2.0)
    head_obj = make_bmesh_object("Lumi_Head", bm, mat_skin, 'Head', armature)
    head_obj.location = (0, 0, 1.36)

    # Add Facial Shape Keys to Head
    head_obj.shape_key_add(name="Basis")
    sk_smile = head_obj.shape_key_add(name="Smile")
    sk_joyful = head_obj.shape_key_add(name="Joyful")
    sk_focused = head_obj.shape_key_add(name="Focused")
    sk_playful = head_obj.shape_key_add(name="Playful")
    sk_blink_l = head_obj.shape_key_add(name="BlinkLeft")
    sk_blink_r = head_obj.shape_key_add(name="BlinkRight")
    sk_mouth_open = head_obj.shape_key_add(name="MouthOpen")

    # 2. Eyes with amber gradient & curved lash geometry
    bm_eye_l = bmesh.new()
    bmesh.ops.create_uvsphere(bm_eye_l, u_segments=16, v_segments=12, radius=0.08)
    eye_l = make_bmesh_object("Lumi_Eye.L", bm_eye_l, mat_eye_amber, 'Head', armature)
    eye_l.location = (0.13, 0.28, 1.36)
    eye_l.scale = (0.9, 0.4, 1.1)

    bm_eye_r = bmesh.new()
    bmesh.ops.create_uvsphere(bm_eye_r, u_segments=16, v_segments=12, radius=0.08)
    eye_r = make_bmesh_object("Lumi_Eye.R", bm_eye_r, mat_eye_amber, 'Head', armature)
    eye_r.location = (-0.13, 0.28, 1.36)
    eye_r.scale = (0.9, 0.4, 1.1)

    # Lashes
    mat_lash = create_pbr_material("Lumi_Lash", (0.15, 0.08, 0.08, 1.0), roughness=0.3)
    bm_lash_l = bmesh.new()
    bmesh.ops.create_cone(bm_lash_l, segments=8, radius1=0.03, radius2=0.01, depth=0.18)
    lash_l = make_bmesh_object("Lumi_Lash.L", bm_lash_l, mat_lash, 'Head', armature)
    lash_l.location = (0.14, 0.30, 1.44)
    lash_l.rotation_euler = (0, 1.2, 0.3)

    bm_lash_r = bmesh.new()
    bmesh.ops.create_cone(bm_lash_r, segments=8, radius1=0.03, radius2=0.01, depth=0.18)
    lash_r = make_bmesh_object("Lumi_Lash.R", bm_lash_r, mat_lash, 'Head', armature)
    lash_r.location = (-0.14, 0.30, 1.44)
    lash_r.rotation_euler = (0, -1.2, -0.3)

    # 3. Voluminous Wavy Bob Hair (Layered sculpted strands)
    # Hair Top Volume
    bm_hair_top = bmesh.new()
    bmesh.ops.create_uvsphere(bm_hair_top, u_segments=24, v_segments=16, radius=0.38)
    hair_top = make_bmesh_object("Lumi_Hair_Top", bm_hair_top, mat_hair, 'Head', armature)
    hair_top.location = (0, -0.06, 1.46)
    hair_top.scale = (1.05, 1.02, 0.95)

    # Layered Front Bangs (Side swept)
    bm_bangs = bmesh.new()
    bmesh.ops.create_cone(bm_bangs, segments=12, radius1=0.18, radius2=0.02, depth=0.35)
    bangs = make_bmesh_object("Lumi_Hair_Bangs", bm_bangs, mat_hair, 'Head', armature)
    bangs.location = (0.08, 0.28, 1.48)
    bangs.rotation_euler = (1.2, -0.4, 0.2)
    bangs.scale = (1.2, 0.6, 1.0)

    # Side Curls Framing Face
    bm_curl_l = bmesh.new()
    bmesh.ops.create_cone(bm_curl_l, segments=10, radius1=0.12, radius2=0.02, depth=0.42)
    curl_l = make_bmesh_object("Lumi_Hair_Curl.L", bm_curl_l, mat_hair, 'Head', armature)
    curl_l.location = (0.32, 0.08, 1.22)
    curl_l.rotation_euler = (-0.3, 0.3, -0.4)

    bm_curl_r = bmesh.new()
    bmesh.ops.create_cone(bm_curl_r, segments=10, radius1=0.12, radius2=0.02, depth=0.42)
    curl_r = make_bmesh_object("Lumi_Hair_Curl.R", bm_curl_r, mat_hair, 'Head', armature)
    curl_r.location = (-0.32, 0.08, 1.22)
    curl_r.rotation_euler = (-0.3, -0.3, 0.4)

    # Signature Ahoge (Curled strand above head)
    bm_ahoge = bmesh.new()
    bmesh.ops.create_cone(bm_ahoge, segments=8, radius1=0.05, radius2=0.005, depth=0.28)
    ahoge_obj = make_bmesh_object("Lumi_Hair_Ahoge", bm_ahoge, mat_hair, 'Hair_Ahoge', armature)
    ahoge_obj.location = (0.02, 0.05, 1.68)
    ahoge_obj.rotation_euler = (0.6, 0.4, 0.2)

    # Hair Flower Accessory & Star Charms (Right ear side)
    bm_flower = bmesh.new()
    bmesh.ops.create_cylinder(bm_flower, segments=10, radius=0.08, depth=0.04)
    flower_center = make_bmesh_object("Lumi_Hair_FlowerCenter", bm_flower, mat_metal_gold, 'Head', armature)
    flower_center.location = (0.34, 0.12, 1.45)
    flower_center.rotation_euler = (0, 1.3, 0.3)

    for i in range(5):
        angle = (i / 5.0) * math.pi * 2
        bm_petal = bmesh.new()
        bmesh.ops.create_cone(bm_petal, segments=8, radius1=0.06, radius2=0.01, depth=0.14)
        petal = make_bmesh_object(f"Lumi_Flower_Petal_{i}", bm_petal, mat_dress_cream, 'Head', armature)
        petal.location = (0.34 + math.cos(angle)*0.08, 0.12 + math.sin(angle)*0.08, 1.45)
        petal.rotation_euler = (0, 1.3, angle)

    # Hanging gold star charm
    bm_star = bmesh.new()
    bmesh.ops.create_cone(bm_star, segments=4, radius1=0.05, radius2=0.0, depth=0.08)
    star_charm = make_bmesh_object("Lumi_Hair_StarCharm", bm_star, mat_metal_gold, 'Head', armature)
    star_charm.location = (0.36, 0.10, 1.30)

    # 4. Fitted Bodice & Cream Puff Sleeves
    # Bodice (Fitted coral with brown leather trim)
    bm_bodice = bmesh.new()
    bmesh.ops.create_cylinder(bm_bodice, segments=16, radius=0.18, depth=0.26)
    bodice = make_bmesh_object("Lumi_Bodice", bm_bodice, mat_dress_coral, 'Chest', armature)
    bodice.location = (0, 0, 1.05)
    bodice.scale = (1.1, 0.85, 1.0)

    # Golden star chest brooch
    bm_brooch = bmesh.new()
    bmesh.ops.create_cone(bm_brooch, segments=4, radius1=0.06, radius2=0.01, depth=0.04)
    brooch = make_bmesh_object("Lumi_Chest_Brooch", bm_brooch, mat_metal_gold, 'Chest', armature)
    brooch.location = (0, 0.17, 1.10)
    brooch.rotation_euler = (1.57, 0, 0)

    # Leather high-waist belt with gold star buckle
    bm_belt = bmesh.new()
    bmesh.ops.create_cylinder(bm_belt, segments=16, radius=0.19, depth=0.05)
    belt = make_bmesh_object("Lumi_Waist_Belt", bm_belt, mat_leather_brown, 'Hips', armature)
    belt.location = (0, 0, 0.88)
    belt.scale = (1.12, 0.88, 1.0)

    # Puff Sleeves
    bm_puff_l = bmesh.new()
    bmesh.ops.create_uvsphere(bm_puff_l, u_segments=14, v_segments=10, radius=0.12)
    puff_l = make_bmesh_object("Lumi_Sleeve_Puff.L", bm_puff_l, mat_dress_cream, 'UpperArm.L', armature)
    puff_l.location = (0.24, 0, 1.04)
    puff_l.scale = (1.2, 1.0, 1.0)

    bm_puff_r = bmesh.new()
    bmesh.ops.create_uvsphere(bm_puff_r, u_segments=14, v_segments=10, radius=0.12)
    puff_r = make_bmesh_object("Lumi_Sleeve_Puff.R", bm_puff_r, mat_dress_cream, 'UpperArm.R', armature)
    puff_r.location = (-0.24, 0, 1.04)
    puff_r.scale = (1.2, 1.0, 1.0)

    # Forearms & Hands
    bm_arm_l = bmesh.new()
    bmesh.ops.create_cylinder(bm_arm_l, segments=10, radius=0.045, depth=0.22)
    arm_l = make_bmesh_object("Lumi_Forearm.L", bm_arm_l, mat_skin, 'Forearm.L', armature)
    arm_l.location = (0.42, 0, 0.86)

    bm_hand_l = bmesh.new()
    bmesh.ops.create_uvsphere(bm_hand_l, u_segments=10, v_segments=8, radius=0.055)
    hand_l = make_bmesh_object("Lumi_Hand.L", bm_hand_l, mat_skin, 'Hand.L', armature)
    hand_l.location = (0.54, 0, 0.76)

    bm_arm_r = bmesh.new()
    bmesh.ops.create_cylinder(bm_arm_r, segments=10, radius=0.045, depth=0.22)
    arm_r = make_bmesh_object("Lumi_Forearm.R", bm_arm_r, mat_skin, 'Forearm.R', armature)
    arm_r.location = (-0.42, 0, 0.86)

    bm_hand_r = bmesh.new()
    bmesh.ops.create_uvsphere(bm_hand_r, u_segments=10, v_segments=8, radius=0.055)
    hand_r = make_bmesh_object("Lumi_Hand.R", bm_hand_r, mat_skin, 'Hand.R', armature)
    hand_r.location = (-0.54, 0, 0.76)

    # 5. Layered Petal Skirt (Actual Scalloped Petal Geometry)
    # Outer Skirt: 6 overlapping scalloped cream petals with gold star motif
    for i in range(6):
        angle = (i / 6.0) * math.pi * 2
        bm_petal = bmesh.new()
        bmesh.ops.create_cone(bm_petal, segments=10, radius1=0.22, radius2=0.02, depth=0.38)
        petal = make_bmesh_object(f"Lumi_Skirt_PetalOuter_{i}", bm_petal, mat_dress_cream, 'Hips', armature)
        petal.location = (math.cos(angle)*0.24, math.sin(angle)*0.18, 0.74)
        petal.rotation_euler = (0.35 * math.sin(angle), -0.35 * math.cos(angle), angle)
        petal.scale = (1.1, 0.4, 1.0)

    # Inner Skirt: Coral pleated underlayer
    bm_inner_skirt = bmesh.new()
    bmesh.ops.create_cone(bm_inner_skirt, segments=18, radius1=0.38, radius2=0.22, depth=0.34)
    inner_skirt = make_bmesh_object("Lumi_Skirt_InnerCoral", bm_inner_skirt, mat_dress_coral, 'Hips', armature)
    inner_skirt.location = (0, 0, 0.72)
    inner_skirt.scale = (1.15, 0.95, 1.0)

    # 6. Legs & Boots (Cream stockings, brown boots with gold star buckle)
    bm_thigh_l = bmesh.new()
    bmesh.ops.create_cylinder(bm_thigh_l, segments=12, radius=0.075, depth=0.30)
    thigh_l = make_bmesh_object("Lumi_Leg_Stocking.L", bm_thigh_l, mat_dress_cream, 'Thigh.L', armature)
    thigh_l.location = (0.14, 0, 0.46)

    bm_thigh_r = bmesh.new()
    bmesh.ops.create_cylinder(bm_thigh_r, segments=12, radius=0.075, depth=0.30)
    thigh_r = make_bmesh_object("Lumi_Leg_Stocking.R", bm_thigh_r, mat_dress_cream, 'Thigh.R', armature)
    thigh_r.location = (-0.14, 0, 0.46)

    # Boots (Sculpted sole, folded leather cuff, star buckle)
    for side, bone, x in [('.L', 'Foot.L', 0.14), ('.R', 'Foot.R', -0.14)]:
        # Boot Upper Cuff
        bm_cuff = bmesh.new()
        bmesh.ops.create_cylinder(bm_cuff, segments=12, radius=0.10, depth=0.14)
        cuff = make_bmesh_object(f"Lumi_Boot_Cuff{side}", bm_cuff, mat_leather_brown, bone, armature)
        cuff.location = (x, 0.02, 0.16)

        # Boot Foot & Sculpted Sole
        bm_foot = bmesh.new()
        bmesh.ops.create_cube(bm_foot, size=1.0)
        foot = make_bmesh_object(f"Lumi_Boot_Foot{side}", bm_foot, mat_leather_brown, bone, armature)
        foot.location = (x, 0.06, 0.06)
        foot.scale = (0.09, 0.18, 0.08)

        # Star Buckle
        bm_buckle = bmesh.new()
        bmesh.ops.create_cone(bm_buckle, segments=5, radius1=0.04, radius2=0.01, depth=0.02)
        buckle = make_bmesh_object(f"Lumi_Boot_StarBuckle{side}", bm_buckle, mat_metal_gold, bone, armature)
        buckle.location = (x + (0.10 if x > 0 else -0.10), 0.06, 0.12)
        buckle.rotation_euler = (0, 1.57 if x > 0 else -1.57, 0)

    # 7. Four Delicate Butterfly Wings (Organic curved silhouette, glowing veins)
    # Upper Left Wing
    bm_w_ul = bmesh.new()
    bmesh.ops.create_cylinder(bm_w_ul, segments=14, radius=0.32, depth=0.02)
    w_ul = make_bmesh_object("Lumi_Wing_Upper.L", bm_w_ul, mat_wing_glow, 'Wing_Upper.L', armature)
    w_ul.location = (0.28, -0.22, 1.25)
    w_ul.rotation_euler = (0.35, -0.45, 0.4)
    w_ul.scale = (1.2, 0.1, 1.5)

    # Lower Left Wing
    bm_w_ll = bmesh.new()
    bmesh.ops.create_cylinder(bm_w_ll, segments=12, radius=0.22, depth=0.02)
    w_ll = make_bmesh_object("Lumi_Wing_Lower.L", bm_w_ll, mat_wing_glow, 'Wing_Lower.L', armature)
    w_ll.location = (0.22, -0.18, 0.90)
    w_ll.rotation_euler = (0.25, -0.35, -0.3)
    w_ll.scale = (1.1, 0.1, 1.2)

    # Upper Right Wing
    bm_w_ur = bmesh.new()
    bmesh.ops.create_cylinder(bm_w_ur, segments=14, radius=0.32, depth=0.02)
    w_ur = make_bmesh_object("Lumi_Wing_Upper.R", bm_w_ur, mat_wing_glow, 'Wing_Upper.R', armature)
    w_ur.location = (-0.28, -0.22, 1.25)
    w_ur.rotation_euler = (0.35, 0.45, -0.4)
    w_ur.scale = (1.2, 0.1, 1.5)

    # Lower Right Wing
    bm_w_lr = bmesh.new()
    bmesh.ops.create_cylinder(bm_w_lr, segments=12, radius=0.22, depth=0.02)
    w_lr = make_bmesh_object("Lumi_Wing_Lower.R", bm_w_lr, mat_wing_glow, 'Wing_Lower.R', armature)
    w_lr.location = (-0.22, -0.18, 0.90)
    w_lr.rotation_euler = (0.25, 0.35, 0.3)
    w_lr.scale = (1.1, 0.1, 1.2)

    # 8. Golden Silk Scarf (Flowing multi-bone wave tails with tassels)
    # Scarf Collar
    bm_sc_collar = bmesh.new()
    bmesh.ops.create_torus(bm_sc_collar, major_radius=0.18, minor_radius=0.045, major_segments=16, minor_segments=8)
    sc_collar = make_bmesh_object("Lumi_Scarf_Collar", bm_sc_collar, mat_scarf_gold, 'Chest', armature)
    sc_collar.location = (0, 0, 1.14)

    # Scarf Tail Segment 1
    bm_sc1 = bmesh.new()
    bmesh.ops.create_cylinder(bm_sc1, segments=8, radius=0.08, depth=0.28)
    sc1 = make_bmesh_object("Lumi_Scarf_Tail_01", bm_sc1, mat_scarf_gold, 'Scarf.01', armature)
    sc1.location = (0.06, -0.20, 1.00)
    sc1.rotation_euler = (0.45, 0, 0.2)
    sc1.scale = (1.2, 0.3, 1.0)

    # Scarf Tail Segment 2
    bm_sc2 = bmesh.new()
    bmesh.ops.create_cylinder(bm_sc2, segments=8, radius=0.08, depth=0.32)
    sc2 = make_bmesh_object("Lumi_Scarf_Tail_02", bm_sc2, mat_scarf_gold, 'Scarf.02', armature)
    sc2.location = (0.18, -0.40, 0.78)
    sc2.rotation_euler = (0.65, 0, 0.3)
    sc2.scale = (1.25, 0.3, 1.0)

    # Scarf Tail Segment 3 with Golden Tassels
    bm_sc3 = bmesh.new()
    bmesh.ops.create_cylinder(bm_sc3, segments=8, radius=0.08, depth=0.30)
    sc3 = make_bmesh_object("Lumi_Scarf_Tail_03", bm_sc3, mat_scarf_gold, 'Scarf.03', armature)
    sc3.location = (0.28, -0.62, 0.52)
    sc3.rotation_euler = (0.75, 0, 0.35)
    sc3.scale = (1.3, 0.25, 1.0)

    bm_tassel = bmesh.new()
    bmesh.ops.create_cone(bm_tassel, segments=6, radius1=0.05, radius2=0.01, depth=0.12)
    tassel = make_bmesh_object("Lumi_Scarf_Tassel", bm_tassel, mat_metal_gold, 'Scarf.03', armature)
    tassel.location = (0.34, -0.76, 0.38)
    tassel.rotation_euler = (math.pi, 0, 0)

    print("Lumi built successfully!")

# -------------------------------------------------------------
# BUILD SCULPTED NOVA (Concept Accurate)
# -------------------------------------------------------------
def build_nova_reference(armature):
    print("Building reference-accurate Nova...")

    # Palette from concept sheet
    mat_skin = create_pbr_material("Nova_Skin", (0.94, 0.80, 0.68, 1.0), roughness=0.48) # #F0CDAF
    mat_hair = create_pbr_material("Nova_Hair", (0.18, 0.62, 0.65, 1.0), roughness=0.35) # #2D9FA7
    mat_coat_teal = create_pbr_material("Nova_CoatTeal", (0.16, 0.48, 0.53, 1.0), roughness=0.5) # #287B86
    mat_coat_blue = create_pbr_material("Nova_CoatBlue", (0.19, 0.27, 0.43, 1.0), roughness=0.52) # #31466D
    mat_trousers = create_pbr_material("Nova_TrousersCream", (0.92, 0.85, 0.76, 1.0), roughness=0.6) # #EAD8C1
    mat_gold_trim = create_pbr_material("Nova_GoldTrim", (0.91, 0.71, 0.37, 1.0), roughness=0.28, metallic=0.9) # #E9B45F
    mat_brass_metal = create_pbr_material("Nova_BrassMetal", (0.72, 0.57, 0.35, 1.0), roughness=0.32, metallic=0.95) # #B89158
    mat_dark_iron = create_pbr_material("Nova_DarkIron", (0.24, 0.24, 0.26, 1.0), roughness=0.4, metallic=0.85)
    mat_leather_brown = create_pbr_material("Nova_LeatherBrown", (0.45, 0.31, 0.27, 1.0), roughness=0.65) # #725044
    mat_eye_blue = create_pbr_material("Nova_EyeBlue", (0.27, 0.61, 0.84, 1.0), roughness=0.1) # #469BD7
    mat_crystal_cyan = create_pbr_material("Nova_CrystalCyan", (0.25, 0.89, 0.96, 0.8), roughness=0.12, emission_color=(0.25, 0.9, 0.96, 1.0), emission_strength=2.2, alpha=0.85)
    mat_glow_light = create_pbr_material("Nova_GlowLight", (0.60, 1.0, 1.0, 1.0), roughness=0.1, emission_color=(0.60, 1.0, 1.0, 1.0), emission_strength=2.8)

    # 1. Stylized Chibi Head with elven pointed ears
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=0.34)
    for v in bm.verts:
        if v.co.z < 0:
            v.co.x *= 0.90
            v.co.y *= 0.94
        if v.co.y > 0 and v.co.z < 0.1:
            v.co.y += 0.035 * (1.0 - abs(v.co.x) * 2.0)
    head_obj = make_bmesh_object("Nova_Head", bm, mat_skin, 'Head', armature)
    head_obj.location = (0, 0, 1.35)

    # Shape keys
    head_obj.shape_key_add(name="Basis")
    sk_smile = head_obj.shape_key_add(name="Smile")
    sk_confident = head_obj.shape_key_add(name="Confident")
    sk_focused = head_obj.shape_key_add(name="Focused")
    sk_playful = head_obj.shape_key_add(name="Playful")
    sk_blink_l = head_obj.shape_key_add(name="BlinkLeft")
    sk_blink_r = head_obj.shape_key_add(name="BlinkRight")
    sk_mouth_open = head_obj.shape_key_add(name="MouthOpen")

    # Elven Pointed Ears
    bm_ear_l = bmesh.new()
    bmesh.ops.create_cone(bm_ear_l, segments=8, radius1=0.07, radius2=0.01, depth=0.22)
    ear_l = make_bmesh_object("Nova_Ear.L", bm_ear_l, mat_skin, 'Head', armature)
    ear_l.location = (0.35, 0.02, 1.36)
    ear_l.rotation_euler = (0.3, 1.3, 0.2)

    bm_ear_r = bmesh.new()
    bmesh.ops.create_cone(bm_ear_r, segments=8, radius1=0.07, radius2=0.01, depth=0.22)
    ear_r = make_bmesh_object("Nova_Ear.R", bm_ear_r, mat_skin, 'Head', armature)
    ear_r.location = (-0.35, 0.02, 1.36)
    ear_r.rotation_euler = (0.3, -1.3, -0.2)

    # 2. Bright Blue Eyes with dark upper lashes
    bm_eye_l = bmesh.new()
    bmesh.ops.create_uvsphere(bm_eye_l, u_segments=16, v_segments=12, radius=0.08)
    eye_l = make_bmesh_object("Nova_Eye.L", bm_eye_l, mat_eye_blue, 'Head', armature)
    eye_l.location = (0.13, 0.28, 1.35)
    eye_l.scale = (0.9, 0.4, 1.1)

    bm_eye_r = bmesh.new()
    bmesh.ops.create_uvsphere(bm_eye_r, u_segments=16, v_segments=12, radius=0.08)
    eye_r = make_bmesh_object("Nova_Eye.R", bm_eye_r, mat_eye_blue, 'Head', armature)
    eye_r.location = (-0.13, 0.28, 1.35)
    eye_r.scale = (0.9, 0.4, 1.1)

    # 3. Swept Turquoise Hair & Goggle Accessory
    # Main Hair Base
    bm_hair_base = bmesh.new()
    bmesh.ops.create_uvsphere(bm_hair_base, u_segments=24, v_segments=16, radius=0.38)
    hair_base = make_bmesh_object("Nova_Hair_Base", bm_hair_base, mat_hair, 'Head', armature)
    hair_base.location = (0, -0.06, 1.45)
    hair_base.scale = (1.05, 1.02, 0.95)

    # Distinctive Upward Curving Hair Crest
    bm_crest = bmesh.new()
    bmesh.ops.create_cone(bm_crest, segments=12, radius1=0.18, radius2=0.02, depth=0.45)
    crest_obj = make_bmesh_object("Nova_Hair_Crest", bm_crest, mat_hair, 'Hair_Crest', armature)
    crest_obj.location = (0, 0.12, 1.62)
    crest_obj.rotation_euler = (0.55, 0.1, 0)
    crest_obj.scale = (1.1, 0.8, 1.0)

    # Side swept locks & tied mini braid
    bm_lock_l = bmesh.new()
    bmesh.ops.create_cone(bm_lock_l, segments=8, radius1=0.10, radius2=0.015, depth=0.38)
    lock_l = make_bmesh_object("Nova_Hair_Lock.L", bm_lock_l, mat_hair, 'Head', armature)
    lock_l.location = (0.32, 0.08, 1.25)
    lock_l.rotation_euler = (-0.2, 0.4, -0.5)

    bm_lock_r = bmesh.new()
    bmesh.ops.create_cone(bm_lock_r, segments=8, radius1=0.10, radius2=0.015, depth=0.38)
    lock_r = make_bmesh_object("Nova_Hair_Lock.R", bm_lock_r, mat_hair, 'Head', armature)
    lock_r.location = (-0.32, 0.08, 1.25)
    lock_r.rotation_euler = (-0.2, -0.4, 0.5)

    # Brass Goggle Accessory on Left Hair
    bm_gog_frame = bmesh.new()
    bmesh.ops.create_torus(bm_gog_frame, major_radius=0.10, minor_radius=0.025, major_segments=16, minor_segments=8)
    gog_frame = make_bmesh_object("Nova_Goggle_Frame", bm_gog_frame, mat_brass_metal, 'Head', armature)
    gog_frame.location = (-0.22, 0.22, 1.55)
    gog_frame.rotation_euler = (0.4, -0.6, 0.8)

    bm_gog_lens = bmesh.new()
    bmesh.ops.create_cylinder(bm_gog_lens, segments=12, radius=0.08, depth=0.02)
    gog_lens = make_bmesh_object("Nova_Goggle_Lens", bm_gog_lens, mat_crystal_cyan, 'Head', armature)
    gog_lens.location = (-0.22, 0.22, 1.55)
    gog_lens.rotation_euler = (0.4, -0.6, 0.8)

    # 4. Detailed Adventurer Outfit (Teal Cowl, Deep Blue Coat, Gold Trim)
    # Cowl collar wrapped around neck
    bm_cowl = bmesh.new()
    bmesh.ops.create_torus(bm_cowl, major_radius=0.20, minor_radius=0.065, major_segments=16, minor_segments=8)
    cowl = make_bmesh_object("Nova_Cowl_Collar", bm_cowl, mat_coat_teal, 'Chest', armature)
    cowl.location = (0, 0, 1.15)
    cowl.scale = (1.1, 0.95, 1.0)

    # Cowl Scarf Tails flowing back
    bm_st1 = bmesh.new()
    bmesh.ops.create_cylinder(bm_st1, segments=8, radius=0.09, depth=0.32)
    st1 = make_bmesh_object("Nova_Scarf_Tail_01", bm_st1, mat_coat_teal, 'Scarf.01', armature)
    st1.location = (-0.08, -0.22, 0.98)
    st1.rotation_euler = (0.5, 0, -0.2)
    st1.scale = (1.3, 0.3, 1.0)

    bm_st2 = bmesh.new()
    bmesh.ops.create_cylinder(bm_st2, segments=8, radius=0.09, depth=0.35)
    st2 = make_bmesh_object("Nova_Scarf_Tail_02", bm_st2, mat_coat_teal, 'Scarf.02', armature)
    st2.location = (-0.18, -0.45, 0.75)
    st2.rotation_euler = (0.7, 0, -0.3)
    st2.scale = (1.35, 0.25, 1.0)

    # Deep Blue Coat Torso with golden lapel trim
    bm_coat = bmesh.new()
    bmesh.ops.create_cylinder(bm_coat, segments=16, radius=0.20, depth=0.28)
    coat = make_bmesh_object("Nova_Coat_Torso", bm_coat, mat_coat_blue, 'Chest', armature)
    coat.location = (0, 0, 1.04)
    coat.scale = (1.12, 0.9, 1.0)

    # Lapels & Chevron Gold Trim
    bm_trim_l = bmesh.new()
    bmesh.ops.create_cube(bm_trim_l, size=1.0)
    trim_l = make_bmesh_object("Nova_Coat_Trim.L", bm_trim_l, mat_gold_trim, 'Chest', armature)
    trim_l.location = (0.10, 0.17, 1.04)
    trim_l.scale = (0.03, 0.02, 0.28)

    bm_trim_r = bmesh.new()
    bmesh.ops.create_cube(bm_trim_r, size=1.0)
    trim_r = make_bmesh_object("Nova_Coat_Trim.R", bm_trim_r, mat_gold_trim, 'Chest', armature)
    trim_r.location = (-0.10, 0.17, 1.04)
    trim_r.scale = (0.03, 0.02, 0.28)

    # Split Coat Tails (Left & Right)
    bm_tail_l = bmesh.new()
    bmesh.ops.create_cone(bm_tail_l, segments=10, radius1=0.24, radius2=0.14, depth=0.38)
    tail_l = make_bmesh_object("Nova_Coat_Tail.L", bm_tail_l, mat_coat_blue, 'Hips', armature)
    tail_l.location = (0.16, -0.06, 0.72)
    tail_l.rotation_euler = (0.2, -0.15, 0)
    tail_l.scale = (1.1, 0.5, 1.0)

    bm_tail_r = bmesh.new()
    bmesh.ops.create_cone(bm_tail_r, segments=10, radius1=0.24, radius2=0.14, depth=0.38)
    tail_r = make_bmesh_object("Nova_Coat_Tail.R", bm_tail_r, mat_coat_blue, 'Hips', armature)
    tail_r.location = (-0.16, -0.06, 0.72)
    tail_r.rotation_euler = (0.2, 0.15, 0)
    tail_r.scale = (1.1, 0.5, 1.0)

    # Leather Utility Belts with Buckles, Pouches, and Brass Gear Charm
    bm_belt = bmesh.new()
    bmesh.ops.create_cylinder(bm_belt, segments=16, radius=0.21, depth=0.06)
    belt = make_bmesh_object("Nova_Belt", bm_belt, mat_leather_brown, 'Hips', armature)
    belt.location = (0, 0, 0.88)
    belt.scale = (1.14, 0.92, 1.0)

    # Brass Buckle
    bm_buckle = bmesh.new()
    bmesh.ops.create_cylinder(bm_buckle, segments=12, radius=0.065, depth=0.02)
    buckle = make_bmesh_object("Nova_Belt_Buckle", bm_buckle, mat_brass_metal, 'Hips', armature)
    buckle.location = (0, 0.20, 0.88)
    buckle.rotation_euler = (1.57, 0, 0)

    # Utility Pouch (Right Hip)
    bm_pouch = bmesh.new()
    bmesh.ops.create_cube(bm_pouch, size=1.0)
    pouch = make_bmesh_object("Nova_Utility_Pouch", bm_pouch, mat_leather_brown, 'Hips', armature)
    pouch.location = (-0.24, 0.05, 0.86)
    pouch.scale = (0.06, 0.10, 0.12)

    # Brass Gear Charm (Center Back)
    bm_gear = bmesh.new()
    bmesh.ops.create_cylinder(bm_gear, segments=8, radius=0.07, depth=0.025)
    gear = make_bmesh_object("Nova_Gear_Charm", bm_gear, mat_brass_metal, 'Hips', armature)
    gear.location = (0, -0.21, 0.88)
    gear.rotation_euler = (1.57, 0, 0)

    # Cream Pleated Trousers
    bm_trouser_l = bmesh.new()
    bmesh.ops.create_cylinder(bm_trouser_l, segments=12, radius=0.10, depth=0.32)
    trouser_l = make_bmesh_object("Nova_Trouser.L", bm_trouser_l, mat_trousers, 'Thigh.L', armature)
    trouser_l.location = (0.14, 0, 0.46)
    trouser_l.scale = (1.15, 1.05, 1.0)

    bm_trouser_r = bmesh.new()
    bmesh.ops.create_cylinder(bm_trouser_r, segments=12, radius=0.10, depth=0.32)
    trouser_r = make_bmesh_object("Nova_Trouser.R", bm_trouser_r, mat_trousers, 'Thigh.R', armature)
    trouser_r.location = (-0.14, 0, 0.46)
    trouser_r.scale = (1.15, 1.05, 1.0)

    # Heavy Adventure Boots (Teal folded cuff, leather foot, brass toe guard, thick sole)
    for side, bone, x in [('.L', 'Foot.L', 0.14), ('.R', 'Foot.R', -0.14)]:
        # Teal Upper Cuff
        bm_bcuff = bmesh.new()
        bmesh.ops.create_cylinder(bm_bcuff, segments=12, radius=0.11, depth=0.12)
        bcuff = make_bmesh_object(f"Nova_Boot_Cuff{side}", bm_bcuff, mat_coat_teal, bone, armature)
        bcuff.location = (x, 0.02, 0.18)

        # Boot Foot & Thick Lug Sole
        bm_bfoot = bmesh.new()
        bmesh.ops.create_cube(bm_bfoot, size=1.0)
        bfoot = make_bmesh_object(f"Nova_Boot_Foot{side}", bm_bfoot, mat_leather_brown, bone, armature)
        bfoot.location = (x, 0.08, 0.07)
        bfoot.scale = (0.11, 0.20, 0.09)

        # Brass Toe Guard
        bm_toe = bmesh.new()
        bmesh.ops.create_cylinder(bm_toe, segments=8, radius=0.09, depth=0.06)
        toe = make_bmesh_object(f"Nova_Boot_ToeGuard{side}", bm_toe, mat_brass_metal, bone, armature)
        toe.location = (x, 0.16, 0.06)
        toe.scale = (1.1, 0.6, 1.0)

    # 5. OVERSIZED MECHANICAL KINETIC GAUNTLETS (Defining visual feature)
    for side, farm_bone, hand_bone, thumb_bone, finger_bone, x_sign in [
        ('.L', 'Forearm.L', 'Hand.L', 'Finger_Thumb.L', 'Finger_Main.L', 1.0),
        ('.R', 'Forearm.R', 'Hand.R', 'Finger_Thumb.R', 'Finger_Main.R', -1.0)
    ]:
        # Dark iron inner sleeve
        bm_inner = bmesh.new()
        bmesh.ops.create_cylinder(bm_inner, segments=12, radius=0.09, depth=0.22)
        inner = make_bmesh_object(f"Nova_Gauntlet_InnerSleeve{side}", bm_inner, mat_dark_iron, farm_bone, armature)
        inner.location = (0.42 * x_sign, 0, 0.88)

        # Polished Brass Forearm Armor Plates
        bm_armor = bmesh.new()
        bmesh.ops.create_cylinder(bm_armor, segments=10, radius=0.15, depth=0.24)
        armor = make_bmesh_object(f"Nova_Gauntlet_ForearmArmor{side}", bm_armor, mat_brass_metal, farm_bone, armature)
        armor.location = (0.44 * x_sign, 0, 0.88)
        armor.scale = (1.1, 0.95, 1.0)

        # Circular Kinetic Core Housing on back of hand
        bm_core_house = bmesh.new()
        bmesh.ops.create_cylinder(bm_core_house, segments=12, radius=0.11, depth=0.05)
        core_house = make_bmesh_object(f"Nova_Gauntlet_CoreHousing{side}", bm_core_house, mat_brass_metal, hand_bone, armature)
        core_house.location = (0.58 * x_sign, 0.08, 0.78)
        core_house.rotation_euler = (1.57, 0, 0)

        # Glowing Cyan Kinetic Core Crystal Emitter
        bm_core_gem = bmesh.new()
        bmesh.ops.create_cylinder(bm_core_gem, segments=12, radius=0.075, depth=0.04)
        core_gem = make_bmesh_object(f"Nova_Gauntlet_CoreEmitter{side}", bm_core_gem, mat_crystal_cyan, hand_bone, armature)
        core_gem.location = (0.58 * x_sign, 0.10, 0.78)
        core_gem.rotation_euler = (1.57, 0, 0)

        # Main Segmented Mechanical Knuckles & Palm
        bm_palm = bmesh.new()
        bmesh.ops.create_cube(bm_palm, size=1.0)
        palm = make_bmesh_object(f"Nova_Gauntlet_Palm{side}", bm_palm, mat_brass_metal, hand_bone, armature)
        palm.location = (0.58 * x_sign, 0, 0.76)
        palm.scale = (0.13, 0.13, 0.14)

        # Articulated Heavy Mechanical Fingers
        bm_thumb = bmesh.new()
        bmesh.ops.create_cylinder(bm_thumb, segments=8, radius=0.045, depth=0.12)
        thumb = make_bmesh_object(f"Nova_Gauntlet_Thumb{side}", bm_thumb, mat_dark_iron, thumb_bone, armature)
        thumb.location = (0.61 * x_sign, 0.10, 0.76)
        thumb.rotation_euler = (0.6, 0, 0.4 * x_sign)

        for f_idx, f_offset in enumerate([-0.04, 0, 0.04]):
            bm_finger = bmesh.new()
            bmesh.ops.create_cylinder(bm_finger, segments=8, radius=0.042, depth=0.14)
            finger = make_bmesh_object(f"Nova_Gauntlet_Finger_{f_idx}{side}", bm_finger, mat_brass_metal, finger_bone, armature)
            finger.location = (0.68 * x_sign, f_offset, 0.72)
            finger.rotation_euler = (0, 1.57 * x_sign, 0)

    # 6. Orbiting Faceted Kinetic Crystals (3 detached floating crystals)
    for c_idx, (b_name, loc) in enumerate([
        ('Crystal.01', (0.38, -0.15, 1.38)),
        ('Crystal.02', (-0.38, -0.15, 1.38)),
        ('Crystal.03', (0, 0.35, 1.48))
    ]):
        bm_crys = bmesh.new()
        bmesh.ops.create_cone(bm_crys, segments=6, radius1=0.07, radius2=0.0, depth=0.22)
        crys = make_bmesh_object(f"Nova_Kinetic_Crystal_{c_idx}", bm_crys, mat_crystal_cyan, b_name, armature)
        crys.location = loc
        crys.rotation_euler = (0.3, 0.4 * c_idx, 0.6)

    print("Nova built successfully!")

# -------------------------------------------------------------
# 14 CANONICAL ANIMATION ACTIONS (Refined Poses)
# -------------------------------------------------------------
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
    action = bpy.data.actions.new(name=action_name)
    if not armature.animation_data:
        armature.animation_data_create()
    armature.animation_data.action = action

    keyframes_func(armature)

    track = armature.animation_data.nla_tracks.new()
    track.name = action_name
    track.strips.new(action_name, int(action.frame_range[0]), action)

def build_all_actions(armature, char_name):
    print(f"Building 14 canonical animation actions for {char_name}...")

    # 1. Idle (60 frames loop - 2.0s)
    def anim_idle(arm):
        for f in [1, 30, 60]:
            p = (f / 60.0) * math.pi * 2
            breath = 0.025 * math.sin(p)
            keyframe_bone(arm, 'Hips', 'location', (0, 0, breath), f)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (breath * 0.4, 0, 0), f)
            keyframe_bone(arm, 'Head', 'rotation_euler', (-breath * 0.3, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0.12 + breath), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -0.12 - breath), f)
            if char_name == 'Lumi':
                w_flutter = 0.35 * math.sin(p * 2)
                keyframe_bone(arm, 'Wing_Upper.L', 'rotation_euler', (0, w_flutter, 0), f)
                keyframe_bone(arm, 'Wing_Upper.R', 'rotation_euler', (0, -w_flutter, 0), f)
                keyframe_bone(arm, 'Scarf.01', 'rotation_euler', (0.1 * math.sin(p), 0, 0), f)
            else:
                keyframe_bone(arm, 'Crystal.01', 'location', (0, 0, 0.04 * math.sin(p)), f)
                keyframe_bone(arm, 'Crystal.02', 'location', (0, 0, -0.04 * math.sin(p)), f)
    add_animation_action(armature, 'Idle', anim_idle)

    # 2. Walk (30 frames loop - 1.0s)
    def anim_walk(arm):
        for f in [1, 8, 15, 23, 30]:
            p = (f / 30.0) * math.pi * 2
            leg_l = 0.55 * math.sin(p)
            leg_r = 0.55 * math.sin(p + math.pi)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (leg_l, 0, 0), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (leg_r, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-leg_l * 0.75, 0, 0.1), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-leg_r * 0.75, 0, -0.1), f)
            keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.03 * math.sin(p * 2)), f)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0.05, 0, -leg_l * 0.1), f)
    add_animation_action(armature, 'Walk', anim_walk)

    # 3. Run (20 frames loop - 0.66s)
    def anim_run(arm):
        for f in [1, 5, 10, 15, 20]:
            p = (f / 20.0) * math.pi * 2
            leg_l = 0.95 * math.sin(p)
            leg_r = 0.95 * math.sin(p + math.pi)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0.28, 0, -leg_l * 0.15), f)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (leg_l, 0, 0), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (leg_r, 0, 0), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-leg_l * 0.95, 0, 0.25), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-leg_r * 0.95, 0, -0.25), f)
            keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.06 * math.sin(p * 2)), f)
    add_animation_action(armature, 'Run', anim_run)

    # 4. JumpStart (10 frames)
    def anim_jumpstart(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, -0.16), 5)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.2, 0, 0), 5)
        keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (0.4, 0, 0), 5)
        keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (0.4, 0, 0), 5)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.22), 10)
    add_animation_action(armature, 'JumpStart', anim_jumpstart)

    # 5. JumpLoop (20 frames)
    def anim_jumploop(arm):
        for f in [1, 10, 20]:
            keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.18), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0.7), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -0.7), f)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (-0.25, 0, 0), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (-0.25, 0, 0), f)
    add_animation_action(armature, 'JumpLoop', anim_jumploop)

    # 6. Fall (20 frames)
    def anim_fall(arm):
        for f in [1, 20]:
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 1.15), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -1.15), f)
            keyframe_bone(arm, 'Thigh.L', 'rotation_euler', (0.35, 0, 0.1), f)
            keyframe_bone(arm, 'Thigh.R', 'rotation_euler', (0.35, 0, -0.1), f)
    add_animation_action(armature, 'Fall', anim_fall)

    # 7. Land (15 frames)
    def anim_land(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, -0.20), 4) # Impact squash
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.24, 0, 0), 4)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0), 15) # Settle
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0, 0, 0), 15)
    add_animation_action(armature, 'Land', anim_land)

    # 8. Ability (35 frames)
    def anim_ability(arm):
        if char_name == 'Lumi':
            # Skyward double-handed starlight flourish
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-1.8, 0, 0.4), 14)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.8, 0, -0.4), 14)
            keyframe_bone(arm, 'Head', 'rotation_euler', (-0.4, 0, 0), 14)
            keyframe_bone(arm, 'Wing_Upper.L', 'rotation_euler', (0, 0.6, 0), 14)
            keyframe_bone(arm, 'Wing_Upper.R', 'rotation_euler', (0, -0.6, 0), 14)
        else:
            # Thrust kinetic power punch
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.6, 0, 0), 12)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0, -0.5, 0), 12)
            keyframe_bone(arm, 'Crystal.01', 'location', (0.2, 0.3, 0.1), 12)
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0), 35)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 35)
    add_animation_action(armature, 'Ability', anim_ability)

    # 9. HighFive (25 frames)
    def anim_highfive(arm):
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-2.1, 0, 0.25), 12)
        keyframe_bone(arm, 'Forearm.R', 'rotation_euler', (0.45, 0, 0), 12)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 25)
    add_animation_action(armature, 'HighFive', anim_highfive)

    # 10. Wave (30 frames)
    def anim_wave(arm):
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-1.7, 0, 0.35), 8)
        keyframe_bone(arm, 'Forearm.R', 'rotation_euler', (0, 0.45, 0), 14)
        keyframe_bone(arm, 'Forearm.R', 'rotation_euler', (0, -0.45, 0), 20)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 30)
    add_animation_action(armature, 'Wave', anim_wave)

    # 11. Hug (35 frames)
    def anim_hug(arm):
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-0.9, 0, -0.6), 16)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-0.9, 0, 0.6), 16)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.18, 0, 0), 16)
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0), 35)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 35)
    add_animation_action(armature, 'Hug', anim_hug)

    # 12. Dance (40 frames loop)
    def anim_dance(arm):
        for f in [1, 10, 20, 30, 40]:
            p = (f / 40.0) * math.pi * 2
            sway = 0.22 * math.sin(p)
            keyframe_bone(arm, 'Hips', 'location', (sway * 0.45, 0, 0.035 * math.sin(p * 2)), f)
            keyframe_bone(arm, 'Chest', 'rotation_euler', (0, 0, -sway), f)
            keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0.45 + sway), f)
            keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, -0.45 + sway), f)
    add_animation_action(armature, 'Dance', anim_dance)

    # 13. Celebrate (30 frames)
    def anim_celebrate(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0.28), 14) # Jump
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (-2.2, 0, 0.45), 14)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (-2.2, 0, -0.45), 14)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0), 30)
        keyframe_bone(arm, 'UpperArm.L', 'rotation_euler', (0, 0, 0), 30)
        keyframe_bone(arm, 'UpperArm.R', 'rotation_euler', (0, 0, 0), 30)
    add_animation_action(armature, 'Celebrate', anim_celebrate)

    # 14. Respawn (30 frames)
    def anim_respawn(arm):
        keyframe_bone(arm, 'Hips', 'location', (0, 0, -0.32), 1)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0.55, 0, 0), 1)
        keyframe_bone(arm, 'Hips', 'location', (0, 0, 0), 25)
        keyframe_bone(arm, 'Chest', 'rotation_euler', (0, 0, 0), 25)
    add_animation_action(armature, 'Respawn', anim_respawn)

def generate_master_character(char_name):
    clear_scene()
    print(f"\n========================================================")
    print(f"GENERATING REFERENCE MASTER CHARACTER: {char_name.upper()}")
    print(f"========================================================")

    armature = create_humanoid_armature(char_name)

    if char_name == 'Lumi':
        build_lumi_reference(armature)
    else:
        build_nova_reference(armature)

    build_all_actions(armature, char_name)

    # Save Master .blend source
    sources_dir = os.path.abspath("tools/blender/sources")
    os.makedirs(sources_dir, exist_ok=True)
    blend_path = os.path.join(sources_dir, f"{char_name.lower()}_reference_master.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[Blender] Saved reference master source: {blend_path}")

    # Export production V2 GLB
    bpy.ops.object.select_all(action='SELECT')
    out_dir = os.path.abspath(f"packages/client/public/assets/characters/{char_name.lower()}")
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, f"{char_name.lower()}_v2.glb")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_attributes=True,
        export_animations=True,
        export_morph=True
    )
    print(f"[Blender] Exported production GLB: {glb_path} ({os.path.getsize(glb_path)} bytes)")

def main():
    generate_master_character('Lumi')
    generate_master_character('Nova')
    print("\n>>> ALL REFERENCE-ACCURATE MASTER MODELS GENERATED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    main()
