"""
Together Apart — Test Asset Generator
Generates a simple stylized test prop GLB with Blender Python (bpy) to verify the asset pipeline.
"""
import bpy
import os
import sys

def main():
    # Clear existing scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Create collection
    col = bpy.data.collections.new("TestPropCollection")
    bpy.context.scene.collection.children.link(col)

    # Create a stylized crystal prism
    mesh = bpy.data.meshes.new("TestCrystalMesh")
    obj = bpy.data.objects.new("TestCrystal", mesh)
    col.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Create bmesh geometry
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=6,
        radius1=0.4,
        radius2=0.0,
        depth=1.2
    )
    bm.to_mesh(mesh)
    bm.free()

    # Material
    mat = bpy.data.materials.new("TestCrystalMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.34, 0.77, 0.84, 1.0) # Nova cyan
        bsdf.inputs['Roughness'].default_value = 0.2
        bsdf.inputs['Metallic'].default_value = 0.1
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (0.2, 0.6, 0.7, 1.0)
            bsdf.inputs['Emission Strength'].default_value = 0.5
    obj.data.materials.append(mat)

    # Output directories
    output_dir = os.path.abspath("packages/client/public/assets/environment/architecture")
    os.makedirs(output_dir, exist_ok=True)
    glb_path = os.path.join(output_dir, "test_prop.glb")

    # Save .blend
    sources_dir = os.path.abspath("tools/blender/sources")
    os.makedirs(sources_dir, exist_ok=True)
    blend_path = os.path.join(sources_dir, "test_prop.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[Blender] Saved source: {blend_path}")

    # Export GLB
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_attributes=True
    )
    print(f"[Blender] Exported GLB: {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

if __name__ == "__main__":
    main()
