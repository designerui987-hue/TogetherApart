import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PuzzleState, Vector3D } from '@together-apart/shared';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { ParticleSystem } from '../graphics/ParticleSystem';
import { soundSynth } from '../audio/SoundSynth';

export class IslandLevel {
  public group: THREE.Group;
  private physicsWorld: PhysicsWorld;
  private particles: ParticleSystem;

  // Challenge 1 meshes & colliders
  public pressurePlateMesh!: THREE.Mesh;
  public pressurePlatePos: THREE.Vector3 = new THREE.Vector3(-2.0, 0.6, 14.0);
  private bridgeGroup: THREE.Group = new THREE.Group();
  private bridgeColliderBody: RAPIER.RigidBody | null = null;
  public leverMesh!: THREE.Mesh;
  public leverPos: THREE.Vector3 = new THREE.Vector3(2.5, 1.2, 32.0);

  // Challenge 2 meshes & colliders
  public novaMechanismMesh!: THREE.Mesh;
  public novaMechanismPos: THREE.Vector3 = new THREE.Vector3(4.0, 2.5, 72.0);
  public movingPlatformMesh!: THREE.Mesh;
  private movingPlatformBody: RAPIER.RigidBody | null = null;
  public lumiPlatformMesh: THREE.Mesh | null = null;
  private lumiPlatformBody: RAPIER.RigidBody | null = null;

  // Challenge 3 meshes & colliders
  public switch1Mesh!: THREE.Mesh;
  public switch1Pos: THREE.Vector3 = new THREE.Vector3(-5.0, 3.5, 114.0);
  public switch2Mesh!: THREE.Mesh;
  public switch2Pos: THREE.Vector3 = new THREE.Vector3(5.0, 3.5, 114.0);
  private heartGateGroup: THREE.Group = new THREE.Group();
  private gateDoorLeft!: THREE.Mesh;
  private gateDoorRight!: THREE.Mesh;
  private gateColliderBody: RAPIER.RigidBody | null = null;

  // Waterfalls & animations
  private waterfalls: THREE.Mesh[] = [];
  private crystalMeshes: THREE.Mesh[] = [];

  constructor(physicsWorld: PhysicsWorld, particles: ParticleSystem) {
    this.group = new THREE.Group();
    this.physicsWorld = physicsWorld;
    this.particles = particles;

    this.buildLevelGeometry();
  }

  private buildLevelGeometry() {
    // Shared materials
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x76c893,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });

    const dirtMat = new THREE.MeshStandardMaterial({
      color: 0xb5838d,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.7,
      metalness: 0.1,
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xedf2f4,
      roughness: 0.6,
      metalness: 0.1,
    });

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.75,
      roughness: 0.1,
    });

    // 1. Island 0: Arrival Meadow (z: -10 to 18)
    this.createFloatingIsland(0, 0, 4, 16, 28, grassMat, dirtMat);
    this.physicsWorld.createStaticBox(0, 0, 4, 8, 1.5, 14);

    // Decorate Arrival Meadow
    this.createFoliage(-4, 0.5, 2);
    this.createFoliage(5, 0.5, -3);
    this.createFoliage(3, 0.5, 8);
    this.createCrystalCluster(-5, 0.5, -4, 0xff758c);
    this.createCrystalCluster(6, 0.5, 10, 0x00f5d4);

    // 2. Challenge 1: Trust Bridge
    // Pressure Plate (entry side)
    const plateGeom = new THREE.CylinderGeometry(0.8, 0.9, 0.15, 24);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffd166,
      emissiveIntensity: 0.4,
    });
    this.pressurePlateMesh = new THREE.Mesh(plateGeom, plateMat);
    this.pressurePlateMesh.position.copy(this.pressurePlatePos);
    this.group.add(this.pressurePlateMesh);

    // Bridge spanning z: 18 to 28
    this.group.add(this.bridgeGroup);
    const bridgeGeom = new THREE.BoxGeometry(3.2, 0.35, 10.0);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, woodMat);
    bridgeMesh.position.set(0, 0.2, 23);
    bridgeMesh.castShadow = true;
    bridgeMesh.receiveShadow = true;
    this.bridgeGroup.add(bridgeMesh);

    // Initial bridge collider (starts lowered/unwalkable or updated)
    const { body: bBody } = this.physicsWorld.createKinematicBox(0, -10, 23, 1.6, 0.2, 5.0);
    this.bridgeColliderBody = bBody;

    // Island 1: Trust Bridge Plateau (z: 28 to 55)
    this.createFloatingIsland(0, 0.5, 41, 15, 26, grassMat, dirtMat);
    this.physicsWorld.createStaticBox(0, 0.5, 41, 7.5, 1.5, 13);

    // Lever on Island 1
    const leverBaseGeom = new THREE.BoxGeometry(0.6, 0.7, 0.6);
    const leverBase = new THREE.Mesh(leverBaseGeom, stoneMat);
    const leverHandleGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
    const leverHandleMat = new THREE.MeshStandardMaterial({ color: 0xef476f, emissive: 0xef476f, emissiveIntensity: 0.5 });
    this.leverMesh = new THREE.Mesh(leverHandleGeom, leverHandleMat);
    this.leverMesh.position.set(0, 0.4, 0);
    this.leverMesh.rotation.z = -0.4;
    leverBase.add(this.leverMesh);
    leverBase.position.copy(this.leverPos);
    this.group.add(leverBase);

    this.createFoliage(-5, 1.0, 36);
    this.createFoliage(4, 1.0, 48);
    this.createWaterfall(-7.2, 0.5, 40);

    // 3. Challenge 2: Magical Crossing (z: 55 to 88)
    // Nova's Mechanism on Floating Spire (x: 4, y: 2.5, z: 72)
    const spireGeom = new THREE.ConeGeometry(1.2, 5.0, 6);
    const spireMesh = new THREE.Mesh(spireGeom, dirtMat);
    spireMesh.position.set(4.0, 0.0, 72.0);
    this.group.add(spireMesh);

    const mechCrystalGeom = new THREE.OctahedronGeometry(0.7, 0);
    this.novaMechanismMesh = new THREE.Mesh(mechCrystalGeom, crystalMat);
    this.novaMechanismMesh.position.copy(this.novaMechanismPos);
    this.group.add(this.novaMechanismMesh);
    this.crystalMeshes.push(this.novaMechanismMesh);

    // Moving Platform (starts at z: 70, moves to z: 82)
    const platformGeom = new THREE.BoxGeometry(3.0, 0.4, 3.0);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x2ed8d8,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });
    this.movingPlatformMesh = new THREE.Mesh(platformGeom, platformMat);
    this.movingPlatformMesh.position.set(0, 1.5, 72);
    this.movingPlatformMesh.castShadow = true;
    this.movingPlatformMesh.receiveShadow = true;
    this.group.add(this.movingPlatformMesh);

    const { body: mpBody } = this.physicsWorld.createKinematicBox(0, 1.5, 72, 1.5, 0.2, 1.5);
    this.movingPlatformBody = mpBody;

    // Island 2: Crystal Spires plateau (z: 88 to 118)
    this.createFloatingIsland(0, 2.0, 103, 16, 28, grassMat, dirtMat);
    this.physicsWorld.createStaticBox(0, 2.0, 103, 8.0, 1.5, 14);

    this.createFoliage(-5, 2.5, 96);
    this.createFoliage(5, 2.5, 106);
    this.createCrystalCluster(6, 2.5, 95, 0x00b4d8);
    this.createCrystalCluster(-6, 2.5, 105, 0xff758c);

    // 4. Challenge 3: Heart Gate
    // Switches 1 and 2
    const switchGeom = new THREE.CylinderGeometry(0.7, 0.75, 0.2, 16);
    const sw1Mat = new THREE.MeshStandardMaterial({ color: 0xff758c, emissive: 0xff758c, emissiveIntensity: 0.6 });
    const sw2Mat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.6 });

    this.switch1Mesh = new THREE.Mesh(switchGeom, sw1Mat);
    this.switch1Mesh.position.copy(this.switch1Pos);
    this.group.add(this.switch1Mesh);

    this.switch2Mesh = new THREE.Mesh(switchGeom, sw2Mat);
    this.switch2Mesh.position.copy(this.switch2Pos);
    this.group.add(this.switch2Mesh);

    // Heart Gate Archway at z: 120
    this.group.add(this.heartGateGroup);
    this.heartGateGroup.position.set(0, 2.0, 120);

    const pillarGeom = new THREE.BoxGeometry(1.2, 6.0, 1.2);
    const leftPillar = new THREE.Mesh(pillarGeom, stoneMat);
    leftPillar.position.set(-2.8, 3.0, 0);
    this.heartGateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeom, stoneMat);
    rightPillar.position.set(2.8, 3.0, 0);
    this.heartGateGroup.add(rightPillar);

    const archTopGeom = new THREE.BoxGeometry(6.8, 1.2, 1.4);
    const archTop = new THREE.Mesh(archTopGeom, stoneMat);
    archTop.position.set(0, 6.0, 0);
    this.heartGateGroup.add(archTop);

    // Glowing Heart Crest on Arch
    const crestGeom = new THREE.OctahedronGeometry(0.8, 0);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xff4081,
      emissive: 0xff4081,
      emissiveIntensity: 0.9,
    });
    const crest = new THREE.Mesh(crestGeom, crestMat);
    crest.position.set(0, 6.0, 0.8);
    this.heartGateGroup.add(crest);
    this.crystalMeshes.push(crest);

    // Sliding Double Doors
    const doorGeom = new THREE.BoxGeometry(2.3, 5.0, 0.35);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x7209b7,
      roughness: 0.5,
      metalness: 0.3,
    });

    this.gateDoorLeft = new THREE.Mesh(doorGeom, doorMat);
    this.gateDoorLeft.position.set(-1.15, 2.5, 0);
    this.heartGateGroup.add(this.gateDoorLeft);

    this.gateDoorRight = new THREE.Mesh(doorGeom, doorMat);
    this.gateDoorRight.position.set(1.15, 2.5, 0);
    this.heartGateGroup.add(this.gateDoorRight);

    // Initial Gate Door collider
    const { body: gBody } = this.physicsWorld.createKinematicBox(0, 4.5, 120, 2.5, 2.5, 0.3);
    this.gateColliderBody = gBody;

    // 5. Victory Summit (z: 124 to 142)
    this.createFloatingIsland(0, 2.5, 133, 14, 18, grassMat, dirtMat);
    this.physicsWorld.createStaticBox(0, 2.5, 133, 7.0, 1.5, 9.0);

    // Heart Shrine at Summit
    const shrineBaseGeom = new THREE.CylinderGeometry(3.0, 3.4, 0.6, 24);
    const shrineBase = new THREE.Mesh(shrineBaseGeom, stoneMat);
    shrineBase.position.set(0, 3.8, 134);
    this.group.add(shrineBase);

    const heartBeaconGeom = new THREE.DodecahedronGeometry(1.2, 0);
    const heartBeaconMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 1.0,
      roughness: 0.1,
    });
    const beacon = new THREE.Mesh(heartBeaconGeom, heartBeaconMat);
    beacon.position.set(0, 5.5, 134);
    this.group.add(beacon);
    this.crystalMeshes.push(beacon);

    this.createCrystalCluster(-3, 3.5, 132, 0xffd166);
    this.createCrystalCluster(3, 3.5, 136, 0xff758c);
  }

  private createFloatingIsland(
    x: number, y: number, z: number,
    width: number, length: number,
    grassMat: THREE.Material, dirtMat: THREE.Material
  ) {
    const islandGroup = new THREE.Group();
    islandGroup.position.set(x, y, z);

    // Top grassy slab
    const topGeom = new THREE.BoxGeometry(width, 1.5, length);
    const topMesh = new THREE.Mesh(topGeom, grassMat);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    islandGroup.add(topMesh);

    // Pointy underside rock cone
    const rockGeom = new THREE.ConeGeometry(Math.min(width, length) * 0.65, 7.0, 7);
    const rockMesh = new THREE.Mesh(rockGeom, dirtMat);
    rockMesh.rotation.x = Math.PI;
    rockMesh.position.y = -3.8;
    rockMesh.castShadow = true;
    islandGroup.add(rockMesh);

    this.group.add(islandGroup);
  }

  private createFoliage(x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.35, 1.8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7f5539, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Low-poly Foliage layers
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x52b788,
      roughness: 0.7,
      flatShading: true,
    });
    const layers = [1.2, 0.9, 0.6];
    layers.forEach((r, idx) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.3, 7), foliageMat);
      cone.position.y = 1.8 + idx * 0.8;
      cone.castShadow = true;
      treeGroup.add(cone);
    });

    this.group.add(treeGroup);
  }

  private createCrystalCluster(x: number, y: number, z: number, colorHex: number) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.3,
    });

    for (let i = 0; i < 4; i++) {
      const geom = new THREE.ConeGeometry(0.18, 0.8 + Math.random() * 0.5, 5);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((Math.random() - 0.5) * 0.4, 0.4, (Math.random() - 0.5) * 0.4);
      mesh.rotation.x = (Math.random() - 0.5) * 0.4;
      mesh.rotation.z = (Math.random() - 0.5) * 0.4;
      cluster.add(mesh);
      this.crystalMeshes.push(mesh);
    }

    this.group.add(cluster);
  }

  private createWaterfall(x: number, y: number, z: number) {
    const fallGeom = new THREE.PlaneGeometry(1.6, 9.0);
    const fallMat = new THREE.MeshStandardMaterial({
      color: 0xa0e7e5,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const waterfall = new THREE.Mesh(fallGeom, fallMat);
    waterfall.position.set(x, y - 4.2, z);
    waterfall.rotation.y = Math.PI / 2;
    this.group.add(waterfall);
    this.waterfalls.push(waterfall);
  }

  public updatePuzzleVisuals(puzzleState: PuzzleState, dt: number) {
    // 1. Challenge 1: Trust Bridge Visual & Collider
    const bridgeProg = puzzleState.trustBridge.bridgeProgress;
    this.bridgeGroup.position.y = THREE.MathUtils.lerp(-4.5, 0.5, bridgeProg);
    if (this.bridgeColliderBody) {
      const colY = bridgeProg > 0.4 ? 0.5 : -15.0; // Walkable when raised
      this.bridgeColliderBody.setTranslation({ x: 0, y: colY, z: 23 }, true);
    }

    // Lever rotation
    if (puzzleState.trustBridge.isBridgeLockedOpen) {
      this.leverMesh.rotation.z = 0.4;
    }

    // 2. Challenge 2: Moving Platform
    if (puzzleState.magicalCrossing.novaMechanismActive) {
      const p = puzzleState.magicalCrossing.movingPlatformProgress;
      // Oscillate along z: 66 to 82
      const targetZ = 66 + Math.sin(p * Math.PI * 2) * 8.0;
      this.movingPlatformMesh.position.z = targetZ;
      if (this.movingPlatformBody) {
        this.movingPlatformBody.setTranslation({ x: 0, y: 1.5, z: targetZ }, true);
      }
    }

    // Lumi Platform sync
    if (puzzleState.magicalCrossing.lumiPlatformActive && puzzleState.magicalCrossing.lumiPlatformPosition) {
      const pos = puzzleState.magicalCrossing.lumiPlatformPosition;
      if (!this.lumiPlatformMesh) {
        const lpGeom = new THREE.CylinderGeometry(1.4, 1.5, 0.25, 16);
        const lpMat = new THREE.MeshStandardMaterial({
          color: 0xffd166,
          emissive: 0xffd166,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.85,
        });
        this.lumiPlatformMesh = new THREE.Mesh(lpGeom, lpMat);
        this.group.add(this.lumiPlatformMesh);

        const { body } = this.physicsWorld.createKinematicBox(pos.x, pos.y, pos.z, 1.4, 0.15, 1.4);
        this.lumiPlatformBody = body;
      }
      this.lumiPlatformMesh.position.set(pos.x, pos.y, pos.z);
      this.lumiPlatformMesh.rotation.y += dt * 1.5;
    } else {
      if (this.lumiPlatformMesh) {
        this.group.remove(this.lumiPlatformMesh);
        this.lumiPlatformMesh.geometry.dispose();
        this.lumiPlatformMesh = null;
      }
      if (this.lumiPlatformBody) {
        this.physicsWorld.removeRigidBody(this.lumiPlatformBody);
        this.lumiPlatformBody = null;
      }
    }

    // 3. Challenge 3: Heart Gate Doors & Collider
    const gateProg = puzzleState.heartGate.gateOpenProgress;
    this.gateDoorLeft.position.x = -1.15 - gateProg * 2.5;
    this.gateDoorRight.position.x = 1.15 + gateProg * 2.5;

    if (this.gateColliderBody) {
      const doorOpen = gateProg > 0.7;
      this.gateColliderBody.setTranslation({ x: 0, y: doorOpen ? -15.0 : 4.5, z: 120 }, true);
    }

    // Switches color glow feedback
    const sw1Mat = this.switch1Mesh.material as THREE.MeshStandardMaterial;
    sw1Mat.emissiveIntensity = puzzleState.heartGate.switch1Active ? 1.5 : 0.4;
    const sw2Mat = this.switch2Mesh.material as THREE.MeshStandardMaterial;
    sw2Mat.emissiveIntensity = puzzleState.heartGate.switch2Active ? 1.5 : 0.4;

    // Environmental animations
    for (const c of this.crystalMeshes) {
      c.rotation.y += dt * 0.8;
    }
  }
}
