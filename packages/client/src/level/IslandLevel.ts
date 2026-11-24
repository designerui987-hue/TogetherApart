import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { ABILITIES, PuzzleState, Vector3D } from '@together-apart/shared';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { ParticleSystem } from '../graphics/ParticleSystem';

export class IslandLevel {
  public group: THREE.Group;
  private physicsWorld: PhysicsWorld;
  private particles: ParticleSystem;

  // Challenge 1: Trust Bridge
  public pressurePlateMesh!: THREE.Mesh;
  public pressurePlateDisc!: THREE.Mesh;
  public pressurePlatePos: THREE.Vector3 = new THREE.Vector3(-2.0, 0.6, 14.0);
  private bridgeGroup: THREE.Group = new THREE.Group();
  private bridgePlanks: THREE.Mesh[] = [];
  private bridgeColliderBody: RAPIER.RigidBody | null = null;
  public leverMesh!: THREE.Mesh;
  public leverBaseMesh!: THREE.Mesh;
  public leverPos: THREE.Vector3 = new THREE.Vector3(2.5, 1.2, 32.0);
  private leverGearMesh!: THREE.Mesh;

  // Challenge 2: Magical Crossing
  public novaMechanismMesh!: THREE.Mesh;
  public novaMechanismPos: THREE.Vector3 = new THREE.Vector3(4.0, 2.5, 72.0);
  private novaGyroOuter!: THREE.Mesh;
  private novaGyroInner!: THREE.Mesh;
  public movingPlatformMesh!: THREE.Mesh;
  private movingPlatformBody: RAPIER.RigidBody | null = null;
  public lumiPlatformMesh: THREE.Mesh | null = null;
  private lumiPlatformBody: RAPIER.RigidBody | null = null;
  private lumiPlatformRing: THREE.Mesh | null = null;

  // Challenge 3: Heart Gate
  public switch1Mesh!: THREE.Mesh;
  public switch1Core!: THREE.Mesh;
  public switch1Pos: THREE.Vector3 = new THREE.Vector3(-5.0, 3.5, 114.0);
  public switch2Mesh!: THREE.Mesh;
  public switch2Core!: THREE.Mesh;
  public switch2Pos: THREE.Vector3 = new THREE.Vector3(5.0, 3.5, 114.0);
  private heartGateGroup: THREE.Group = new THREE.Group();
  private gateDoorLeft!: THREE.Mesh;
  private gateDoorRight!: THREE.Mesh;
  private gateColliderBody: RAPIER.RigidBody | null = null;
  private conduitLeft!: THREE.Mesh;
  private conduitRight!: THREE.Mesh;
  private heartArchGem!: THREE.Mesh;

  // Victory Summit
  private beaconMesh!: THREE.Mesh;
  private beaconRings: THREE.Mesh[] = [];

  // Animated Environment Elements
  private waterfalls: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; speed: number }[] = [];
  private animatedCrystals: THREE.Mesh[] = [];
  private butterflies: { group: THREE.Group; basePos: THREE.Vector3; freq: number; wingL: THREE.Mesh; wingR: THREE.Mesh }[] = [];
  private fireflies: { mesh: THREE.Mesh; basePos: THREE.Vector3; offset: number }[] = [];
  private instancedFlowers!: THREE.InstancedMesh;
  private instancedGrass!: THREE.InstancedMesh;

  constructor(physicsWorld: PhysicsWorld, particles: ParticleSystem) {
    this.group = new THREE.Group();
    this.physicsWorld = physicsWorld;
    this.particles = particles;

    this.buildLevelGeometry();
  }

  private buildLevelGeometry() {
    // ------------------------------------------
    // SHARED HIGH QUALITY STYLIZED MATERIALS
    // ------------------------------------------
    const grassTopMat = new THREE.MeshStandardMaterial({
      color: 0x76c893,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });

    const mossEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x52b788,
      roughness: 0.85,
      flatShading: true,
    });

    const rockStrataMat = new THREE.MeshStandardMaterial({
      color: 0x9c6644,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    });

    const woodPlankMat = new THREE.MeshStandardMaterial({
      color: 0xba7c59,
      roughness: 0.75,
      metalness: 0.05,
    });

    const ancientStoneMat = new THREE.MeshStandardMaterial({
      color: 0xf9eddc,
      roughness: 0.65,
      metalness: 0.1,
    });

    const brassGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf3cd82,
      roughness: 0.35,
      metalness: 0.65,
    });

    const magicCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.2,
    });

    const rubyCrystalMat = new THREE.MeshStandardMaterial({
      color: 0xf28b9d,
      emissive: 0xf28b9d,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.2,
    });

    // ------------------------------------------
    // 1. ISLAND 0: ARRIVAL MEADOW (z: -10 to 18)
    // ------------------------------------------
    this.createOrganicFloatingIsland(0, 0, 4, 18, 28, grassTopMat, mossEdgeMat, rockStrataMat);
    this.physicsWorld.createStaticBox(0, 0, 4, 9, 1.5, 14);

    // Island 0 Path & Decor
    this.createStonePathway(0, 0.76, -4, 0, 0.76, 12, ancientStoneMat);
    this.createStylizedTree(-5, 0.75, 2, 1.2);
    this.createStylizedTree(6, 0.75, -2, 1.0);
    this.createStylizedTree(4.5, 0.75, 9, 1.15);
    this.createFairyMushroomCluster(-4, 0.75, 7, 0xf28b9d);
    this.createFairyMushroomCluster(5, 0.75, 4, 0x00f5d4);
    this.createCrystalCluster(-6.5, 0.75, -4, 0xf28b9d);
    this.createCrystalCluster(7, 0.75, 10, 0x00f5d4);

    // ------------------------------------------
    // 2. CHALLENGE 1: THE TRUST BRIDGE
    // ------------------------------------------
    // Ornate Pressure Plate (Entry side at x: -2, y: 0.6, z: 14)
    const plateBaseGeom = new THREE.CylinderGeometry(1.05, 1.2, 0.2, 24);
    const plateBase = new THREE.Mesh(plateBaseGeom, ancientStoneMat);
    plateBase.position.copy(this.pressurePlatePos);
    this.group.add(plateBase);

    const plateDiscGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.12, 24);
    const plateDiscMat = new THREE.MeshStandardMaterial({
      color: 0xf3cd82,
      emissive: 0xf3cd82,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
    });
    this.pressurePlateDisc = new THREE.Mesh(plateDiscGeom, plateDiscMat);
    this.pressurePlateDisc.position.set(0, 0.1, 0);
    plateBase.add(this.pressurePlateDisc);
    this.pressurePlateMesh = plateBase;

    // Glowing rune ring around plate
    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 8, 24), brassGoldMat);
    runeRing.rotation.x = Math.PI / 2;
    runeRing.position.y = 0.11;
    plateBase.add(runeRing);

    // Wooden Rope Bridge spanning z: 18 to 28
    this.group.add(this.bridgeGroup);
    this.buildOrnateBridge(woodPlankMat, ancientStoneMat, brassGoldMat);

    // Initial bridge collider (starts lowered/unwalkable or updated)
    const { body: bBody } = this.physicsWorld.createKinematicBox(0, -10, 23, 1.8, 0.2, 5.0);
    this.bridgeColliderBody = bBody;

    // Island 1: Trust Bridge Plateau (z: 28 to 55)
    this.createOrganicFloatingIsland(0, 0.5, 41, 17, 26, grassTopMat, mossEdgeMat, rockStrataMat);
    this.physicsWorld.createStaticBox(0, 0.5, 41, 8.5, 1.5, 13);

    // Crystal Gear Lever on Island 1 (x: 2.5, y: 1.2, z: 32)
    this.buildOrnateLever(this.leverPos, ancientStoneMat, brassGoldMat, magicCrystalMat);

    this.createStylizedTree(-5.5, 1.25, 36, 1.3);
    this.createStylizedTree(5, 1.25, 48, 1.1);
    this.createWaterfall(-8.0, 0.5, 40, 2.2, 11);

    // ------------------------------------------
    // 3. CHALLENGE 2: MAGICAL CROSSING (z: 55 to 88)
    // ------------------------------------------
    // Nova's Mechanism on Floating Spire (x: 4.0, y: 2.5, z: 72.0)
    this.buildNovaMechanism(this.novaMechanismPos, ancientStoneMat, brassGoldMat, magicCrystalMat);

    // Moving Platform (starts at z: 70, oscillates to z: 82)
    this.buildMovingPlatform(woodPlankMat, ancientStoneMat, brassGoldMat);
    const { body: mpBody } = this.physicsWorld.createKinematicBox(0, 1.5, 72, 1.8, 0.25, 1.8);
    this.movingPlatformBody = mpBody;

    // Island 2: Crystal Spires Plateau (z: 88 to 118)
    this.createOrganicFloatingIsland(0, 2.0, 103, 18, 28, grassTopMat, mossEdgeMat, rockStrataMat);
    this.physicsWorld.createStaticBox(0, 2.0, 103, 9.0, 1.5, 14);

    this.createStylizedTree(-5.5, 2.75, 96, 1.25);
    this.createStylizedTree(5.5, 2.75, 107, 1.15);
    this.createCrystalCluster(6.8, 2.75, 95, 0x00f5d4);
    this.createCrystalCluster(-6.8, 2.75, 105, 0xf28b9d);
    this.createFairyMushroomCluster(3, 2.75, 98, 0xf3cd82);

    // ------------------------------------------
    // 4. CHALLENGE 3: THE HEART GATE
    // ------------------------------------------
    // Switches 1 & 2 Pedestals
    this.buildHeartSwitch(1, this.switch1Pos, ancientStoneMat, brassGoldMat, rubyCrystalMat);
    this.buildHeartSwitch(2, this.switch2Pos, ancientStoneMat, brassGoldMat, magicCrystalMat);

    // Glowing ground conduits from switches to Heart Gate
    this.buildGroundConduits();

    // Monumental Heart Gate Archway at z: 120
    this.buildHeartGateArch(ancientStoneMat, brassGoldMat, rubyCrystalMat);

    // Initial Gate Door collider
    const { body: gBody } = this.physicsWorld.createKinematicBox(0, 4.5, 120, 2.8, 2.8, 0.35);
    this.gateColliderBody = gBody;

    // ------------------------------------------
    // 5. VICTORY SUMMIT (z: 124 to 142)
    // ------------------------------------------
    this.createOrganicFloatingIsland(0, 2.5, 133, 16, 20, grassTopMat, mossEdgeMat, rockStrataMat);
    this.physicsWorld.createStaticBox(0, 2.5, 133, 8.0, 1.5, 10.0);

    // Shrine, Beacon & Columns at Summit
    this.buildVictoryShrine(ancientStoneMat, brassGoldMat, rubyCrystalMat);

    // ------------------------------------------
    // 6. INSTANCED FLORA, BUTTERFLIES & ATMOSPHERE
    // ------------------------------------------
    this.populateFlora();
    this.spawnButterflies();
    this.spawnFireflies();
    this.createDistantIslands();
  }

  // ==========================================
  // ORGANIC ISLAND GENERATOR
  // ==========================================
  private createOrganicFloatingIsland(
    x: number, y: number, z: number,
    width: number, length: number,
    grassMat: THREE.Material, mossMat: THREE.Material, rockMat: THREE.Material
  ) {
    const island = new THREE.Group();
    island.position.set(x, y, z);

    // 1. Lush grass top slab
    const topGeom = new THREE.BoxGeometry(width, 1.5, length);
    const topMesh = new THREE.Mesh(topGeom, grassMat);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    island.add(topMesh);

    // 2. Overhanging rounded moss rim
    const rimGeom = new THREE.BoxGeometry(width + 0.4, 0.5, length + 0.4);
    const rimMesh = new THREE.Mesh(rimGeom, mossMat);
    rimMesh.position.y = 0.55;
    rimMesh.castShadow = true;
    island.add(rimMesh);

    // 3. Multi-tier stratified rock underside
    const strataHeights = [3.2, 5.5, 7.8];
    const strataScales = [0.85, 0.6, 0.35];

    strataHeights.forEach((h, idx) => {
      const sWidth = width * strataScales[idx];
      const sLength = length * strataScales[idx];
      const strataGeom = new THREE.ConeGeometry(Math.min(sWidth, sLength) * 0.7, 4.2, 8);
      const strataMesh = new THREE.Mesh(strataGeom, rockMat);
      strataMesh.rotation.x = Math.PI;
      strataMesh.position.y = -h;
      strataMesh.rotation.y = (idx * Math.PI) / 4;
      strataMesh.castShadow = true;
      island.add(strataMesh);
    });

    this.group.add(island);
  }

  private createStonePathway(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    stoneMat: THREE.Material
  ) {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = THREE.MathUtils.lerp(x1, x2, t) + (Math.sin(i * 1.8) * 0.4);
      const py = THREE.MathUtils.lerp(y1, y2, t);
      const pz = THREE.MathUtils.lerp(z1, z2, t);

      const geom = new THREE.CylinderGeometry(0.65 + Math.random() * 0.25, 0.75, 0.1, 8);
      const stone = new THREE.Mesh(geom, stoneMat);
      stone.position.set(px, py, pz);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      this.group.add(stone);
    }
  }

  // ==========================================
  // STYLIZED VEGETATION
  // ==========================================
  private createStylizedTree(x: number, y: number, z: number, scale: number = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.set(scale, scale, scale);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.85 });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x58b97d,
      roughness: 0.7,
      flatShading: true,
    });
    const foliageHighlightMat = new THREE.MeshStandardMaterial({
      color: 0x83e098,
      roughness: 0.65,
      flatShading: true,
    });

    // Twisted trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 2.4, 8), trunkMat);
    trunk.position.y = 1.2;
    trunk.castShadow = true;
    tree.add(trunk);

    // Multi-tiered cloud-like foliage puffs
    const tiers = [
      { y: 2.4, r: 1.5, mat: foliageMat },
      { y: 3.3, r: 1.2, mat: foliageHighlightMat },
      { y: 4.1, r: 0.85, mat: foliageMat },
    ];

    tiers.forEach((t) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(t.r, 1), t.mat);
      puff.position.y = t.y;
      puff.scale.set(1.2, 0.8, 1.1);
      puff.castShadow = true;
      tree.add(puff);
    });

    this.group.add(tree);
  }

  private createFairyMushroomCluster(x: number, y: number, z: number, colorHex: number) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0xfbf8cc, roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });

    for (let i = 0; i < 4; i++) {
      const r = 0.12 + Math.random() * 0.14;
      const h = 0.3 + Math.random() * 0.35;
      const ox = (Math.random() - 0.5) * 0.5;
      const oz = (Math.random() - 0.5) * 0.5;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, h, 6), stemMat);
      stem.position.set(ox, h / 2, oz);
      cluster.add(stem);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), capMat);
      cap.position.set(ox, h + 0.05, oz);
      cap.scale.set(1.0, 0.65, 1.0);
      cluster.add(cap);
      this.animatedCrystals.push(cap);
    }

    this.group.add(cluster);
  }

  private createCrystalCluster(x: number, y: number, z: number, colorHex: number) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.25,
    });

    for (let i = 0; i < 5; i++) {
      const h = 0.7 + Math.random() * 0.7;
      const geom = new THREE.ConeGeometry(0.18, h, 6);
      const crystal = new THREE.Mesh(geom, mat);
      crystal.position.set((Math.random() - 0.5) * 0.45, h / 2, (Math.random() - 0.5) * 0.45);
      crystal.rotation.x = (Math.random() - 0.5) * 0.35;
      crystal.rotation.z = (Math.random() - 0.5) * 0.35;
      crystal.castShadow = true;
      cluster.add(crystal);
      this.animatedCrystals.push(crystal);
    }

    this.group.add(cluster);
  }

  // ==========================================
  // WATERFALLS WITH SCROLLING FOAM & MIST
  // ==========================================
  private createWaterfall(x: number, y: number, z: number, width: number, height: number) {
    const fallGeom = new THREE.PlaneGeometry(width, height, 1, 8);
    const fallMat = new THREE.MeshStandardMaterial({
      color: 0x80deea,
      emissive: 0x26c6da,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });

    const fallMesh = new THREE.Mesh(fallGeom, fallMat);
    fallMesh.position.set(x, y - height / 2, z);
    fallMesh.rotation.y = Math.PI / 2;
    this.group.add(fallMesh);

    this.waterfalls.push({ mesh: fallMesh, mat: fallMat, speed: 2.2 });
  }

  // ==========================================
  // ORNATE PUZZLE MESHES
  // ==========================================
  private buildOrnateBridge(woodMat: THREE.Material, stoneMat: THREE.Material, goldMat: THREE.Material) {
    // Stanchion posts at bridge entries
    const postGeom = new THREE.CylinderGeometry(0.14, 0.18, 1.4, 8);
    const posts = [
      { x: -1.7, y: 0.8, z: 18 },
      { x: 1.7, y: 0.8, z: 18 },
      { x: -1.7, y: 0.8, z: 28 },
      { x: 1.7, y: 0.8, z: 28 },
    ];
    posts.forEach((p) => {
      const post = new THREE.Mesh(postGeom, stoneMat);
      post.position.set(p.x, p.y, p.z);
      this.group.add(post);

      const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), goldMat);
      cap.position.set(p.x, p.y + 0.75, p.z);
      this.group.add(cap);
    });

    // 14 individually carved weathered bridge planks spanning z: 18 to 28
    const numPlanks = 14;
    for (let i = 0; i < numPlanks; i++) {
      const pz = 18.5 + (i / (numPlanks - 1)) * 9.0;
      const plankGeom = new THREE.BoxGeometry(3.3, 0.22, 0.55);
      const plank = new THREE.Mesh(plankGeom, woodMat);
      plank.position.set(0, 0.2, pz);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.bridgeGroup.add(plank);
      this.bridgePlanks.push(plank);
    }
  }

  private buildOrnateLever(pos: THREE.Vector3, stoneMat: THREE.Material, goldMat: THREE.Material, crystalMat: THREE.Material) {
    const pedestal = new THREE.Group();
    pedestal.position.copy(pos);

    // Carved stone base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.8, 8), stoneMat);
    pedestal.add(base);

    // Concentric brass gear
    this.leverGearMesh = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16), goldMat);
    this.leverGearMesh.position.y = 0.42;
    this.leverGearMesh.rotation.x = Math.PI / 2;
    pedestal.add(this.leverGearMesh);

    // Lever arm with glowing crystal top
    const handleGroup = new THREE.Group();
    handleGroup.position.set(0, 0.45, 0);

    const handleRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8), goldMat);
    handleRod.position.y = 0.4;
    handleGroup.add(handleRod);

    const handleGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), crystalMat);
    handleGem.position.y = 0.85;
    handleGroup.add(handleGem);
    this.animatedCrystals.push(handleGem);

    handleGroup.rotation.z = -0.45; // Initial unlocked tilt
    this.leverMesh = handleGroup as any;
    pedestal.add(handleGroup);

    this.group.add(pedestal);
  }

  private buildNovaMechanism(pos: THREE.Vector3, stoneMat: THREE.Material, goldMat: THREE.Material, crystalMat: THREE.Material) {
    const spireGroup = new THREE.Group();
    spireGroup.position.set(pos.x, 0, pos.z);

    // Elegant carved spire column
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 5.0, 8), stoneMat);
    colMesh.position.y = 2.5;
    spireGroup.add(colMesh);

    // Central Obelisk Power Crystal
    this.novaMechanismMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), crystalMat);
    this.novaMechanismMesh.position.set(0, 5.4, 0);
    spireGroup.add(this.novaMechanismMesh);
    this.animatedCrystals.push(this.novaMechanismMesh);

    // Gyroscope Ring Outer
    this.novaGyroOuter = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 24), goldMat);
    this.novaGyroOuter.position.set(0, 5.4, 0);
    spireGroup.add(this.novaGyroOuter);

    // Gyroscope Ring Inner
    this.novaGyroInner = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 8, 20), goldMat);
    this.novaGyroInner.position.set(0, 5.4, 0);
    spireGroup.add(this.novaGyroInner);

    this.group.add(spireGroup);
  }

  private buildMovingPlatform(woodMat: THREE.Material, stoneMat: THREE.Material, goldMat: THREE.Material) {
    const platform = new THREE.Group();
    platform.position.set(0, 1.5, 72);

    // Main stone slab
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 3.6), stoneMat);
    slab.castShadow = true;
    slab.receiveShadow = true;
    platform.add(slab);

    // Wooden deck inlay
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 3.0), woodMat);
    deck.position.y = 0.25;
    deck.receiveShadow = true;
    platform.add(deck);

    // 4 Corner brass corner brackets
    const corners = [-1.6, 1.6];
    corners.forEach((cx) => {
      corners.forEach((cz) => {
        const bracket = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), goldMat);
        bracket.position.set(cx, 0.25, cz);
        platform.add(bracket);
      });
    });

    this.movingPlatformMesh = platform as any;
    this.group.add(platform);
  }

  private buildHeartSwitch(
    num: 1 | 2,
    pos: THREE.Vector3,
    stoneMat: THREE.Material,
    goldMat: THREE.Material,
    crystalMat: THREE.Material
  ) {
    const swGroup = new THREE.Group();
    swGroup.position.copy(pos);

    // Stone pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 0.6, 8), stoneMat);
    swGroup.add(base);

    // Luminous core cylinder
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.25, 16), crystalMat);
    core.position.y = 0.35;
    swGroup.add(core);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 8, 20), goldMat);
    rim.position.y = 0.4;
    rim.rotation.x = Math.PI / 2;
    swGroup.add(rim);

    if (num === 1) {
      this.switch1Mesh = swGroup as any;
      this.switch1Core = core;
    } else {
      this.switch2Mesh = swGroup as any;
      this.switch2Core = core;
    }

    this.group.add(swGroup);
  }

  private buildGroundConduits() {
    const conduitMatL = new THREE.MeshStandardMaterial({
      color: 0xf28b9d,
      emissive: 0xf28b9d,
      emissiveIntensity: 0.4,
    });
    const conduitMatR = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.4,
    });

    // Left conduit from (-5, 114) to (-2, 120)
    const conduitLGeom = new THREE.BoxGeometry(0.2, 0.08, 6.5);
    this.conduitLeft = new THREE.Mesh(conduitLGeom, conduitMatL);
    this.conduitLeft.position.set(-3.5, 3.55, 117);
    this.conduitLeft.rotation.y = 0.45;
    this.group.add(this.conduitLeft);

    // Right conduit from (5, 114) to (2, 120)
    const conduitRGeom = new THREE.BoxGeometry(0.2, 0.08, 6.5);
    this.conduitRight = new THREE.Mesh(conduitRGeom, conduitMatR);
    this.conduitRight.position.set(3.5, 3.55, 117);
    this.conduitRight.rotation.y = -0.45;
    this.group.add(this.conduitRight);
  }

  private buildHeartGateArch(stoneMat: THREE.Material, goldMat: THREE.Material, gemMat: THREE.Material) {
    this.group.add(this.heartGateGroup);
    this.heartGateGroup.position.set(0, 2.0, 120);

    // Monumental pillars
    const pillarGeom = new THREE.CylinderGeometry(0.9, 1.2, 7.5, 12);
    const leftPillar = new THREE.Mesh(pillarGeom, stoneMat);
    leftPillar.position.set(-3.2, 3.75, 0);
    leftPillar.castShadow = true;
    this.heartGateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeom, stoneMat);
    rightPillar.position.set(3.2, 3.75, 0);
    rightPillar.castShadow = true;
    this.heartGateGroup.add(rightPillar);

    // Sculpted intertwined heart archway lintel
    const archTopGeom = new THREE.BoxGeometry(8.2, 1.5, 1.8);
    const archTop = new THREE.Mesh(archTopGeom, stoneMat);
    archTop.position.set(0, 7.5, 0);
    archTop.castShadow = true;
    this.heartGateGroup.add(archTop);

    // Giant Heart Gem Crest atop Archway
    this.heartArchGem = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), gemMat);
    this.heartArchGem.position.set(0, 8.8, 0.6);
    this.heartGateGroup.add(this.heartArchGem);
    this.animatedCrystals.push(this.heartArchGem);

    // Sliding Double Portals
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e6f,
      roughness: 0.45,
      metalness: 0.35,
    });
    const doorGeom = new THREE.BoxGeometry(2.8, 6.8, 0.35);

    this.gateDoorLeft = new THREE.Mesh(doorGeom, doorMat);
    this.gateDoorLeft.position.set(-1.4, 3.4, 0);
    this.gateDoorLeft.castShadow = true;
    this.heartGateGroup.add(this.gateDoorLeft);

    this.gateDoorRight = new THREE.Mesh(doorGeom, doorMat);
    this.gateDoorRight.position.set(1.4, 3.4, 0);
    this.gateDoorRight.castShadow = true;
    this.heartGateGroup.add(this.gateDoorRight);
  }

  private buildVictoryShrine(stoneMat: THREE.Material, goldMat: THREE.Material, gemMat: THREE.Material) {
    const shrine = new THREE.Group();
    shrine.position.set(0, 3.8, 134);

    // Circular marble dais
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.7, 32), stoneMat);
    dais.receiveShadow = true;
    shrine.add(dais);

    // 4 Classical columns surrounding the altar
    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 4.2, 12), stoneMat);
      col.position.set(Math.cos(angle) * 3.2, 2.1, Math.sin(angle) * 3.2);
      col.castShadow = true;
      shrine.add(col);
    }

    // Floating Grand Heart Beacon
    this.beaconMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), gemMat);
    this.beaconMesh.position.set(0, 2.5, 0);
    shrine.add(this.beaconMesh);
    this.animatedCrystals.push(this.beaconMesh);

    // Luminous orbit rings
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0 + r * 0.4, 0.04, 8, 32), goldMat);
      ring.position.set(0, 2.5, 0);
      ring.rotation.x = Math.PI / 4 + r * 0.5;
      shrine.add(ring);
      this.beaconRings.push(ring);
    }

    this.group.add(shrine);
  }

  // ==========================================
  // INSTANCED FLORA, BUTTERFLIES & PARTICLES
  // ==========================================
  private populateFlora() {
    // Wildflowers instanced across grassy surfaces
    const flowerGeom = new THREE.ConeGeometry(0.12, 0.25, 5);
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xf28b9d,
      roughness: 0.6,
      flatShading: true,
    });

    const flowerCount = 60;
    this.instancedFlowers = new THREE.InstancedMesh(flowerGeom, flowerMat, flowerCount);

    const dummy = new THREE.Object3D();
    const colors = [0xf28b9d, 0xf3cd82, 0x56c5d5, 0xffffff];

    for (let i = 0; i < flowerCount; i++) {
      const z = -6 + Math.random() * 140;
      const x = (Math.random() - 0.5) * 12;
      const y = z < 25 ? 0.75 : (z < 60 ? 1.25 : (z < 95 ? 2.25 : 3.75));

      dummy.position.set(x, y, z);
      dummy.rotation.x = (Math.random() - 0.5) * 0.3;
      dummy.rotation.z = (Math.random() - 0.5) * 0.3;
      dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      dummy.updateMatrix();

      this.instancedFlowers.setMatrixAt(i, dummy.matrix);
      this.instancedFlowers.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    }
    this.instancedFlowers.instanceMatrix.needsUpdate = true;
    if (this.instancedFlowers.instanceColor) this.instancedFlowers.instanceColor.needsUpdate = true;
    this.group.add(this.instancedFlowers);
  }

  private spawnButterflies() {
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0x56c5d5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const wingGeom = new THREE.PlaneGeometry(0.14, 0.14);

    for (let b = 0; b < 6; b++) {
      const bGroup = new THREE.Group();
      const wingL = new THREE.Mesh(wingGeom, wingMat);
      wingL.position.x = -0.07;
      bGroup.add(wingL);

      const wingR = new THREE.Mesh(wingGeom, wingMat);
      wingR.position.x = 0.07;
      wingR.scale.x = -1;
      bGroup.add(wingR);

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        1.5 + Math.random() * 3.0,
        Math.random() * 120
      );
      bGroup.position.copy(basePos);
      this.group.add(bGroup);

      this.butterflies.push({
        group: bGroup,
        basePos,
        freq: 12 + Math.random() * 6,
        wingL,
        wingR,
      });
    }
  }

  private spawnFireflies() {
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xfff382 });
    const fireflyGeom = new THREE.SphereGeometry(0.04, 6, 6);

    for (let f = 0; f < 16; f++) {
      const mesh = new THREE.Mesh(fireflyGeom, fireflyMat);
      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        1.0 + Math.random() * 4.0,
        Math.random() * 135
      );
      mesh.position.copy(basePos);
      this.group.add(mesh);
      this.fireflies.push({ mesh, basePos, offset: f * 1.2 });
    }
  }

  private createDistantIslands() {
    const distantMat = new THREE.MeshStandardMaterial({
      color: 0x8a9ba8,
      roughness: 0.95,
      flatShading: true,
    });

    for (let d = 0; d < 8; d++) {
      const distGroup = new THREE.Group();
      const w = 12 + Math.random() * 18;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 2.0, w), distantMat);
      distGroup.add(top);

      const bottom = new THREE.Mesh(new THREE.ConeGeometry(w * 0.6, 12, 6), distantMat);
      bottom.rotation.x = Math.PI;
      bottom.position.y = -6.5;
      distGroup.add(bottom);

      distGroup.position.set(
        (Math.random() > 0.5 ? 1 : -1) * (45 + Math.random() * 55),
        -10 + Math.random() * 25,
        Math.random() * 160 - 20
      );
      this.group.add(distGroup);
    }
  }

  // ==========================================
  // REAL-TIME PUZZLE & ENVIRONMENT TICK
  // ==========================================
  public updatePuzzleVisuals(puzzleState: PuzzleState, dt: number) {
    const time = performance.now() * 0.001;

    // 1. Challenge 1: Trust Bridge Planks & Collider
    const bridgeProg = puzzleState.trustBridge.bridgeProgress;
    this.bridgeGroup.position.y = THREE.MathUtils.lerp(-4.5, 0.5, bridgeProg);

    // Wave ripples across bridge planks when raising
    this.bridgePlanks.forEach((plank, idx) => {
      plank.position.y = Math.sin(time * 3.0 + idx * 0.4) * (1.0 - bridgeProg) * 0.15;
    });

    if (this.bridgeColliderBody) {
      const colY = bridgeProg > 0.4 ? 0.5 : -15.0;
      this.bridgeColliderBody.setTranslation({ x: 0, y: colY, z: 23 }, true);
    }

    // Lever Gear rotation & handle position
    if (this.leverMesh) {
      const targetZ = puzzleState.trustBridge.isBridgeLockedOpen ? 0.45 : -0.45;
      this.leverMesh.rotation.z = THREE.MathUtils.lerp(this.leverMesh.rotation.z, targetZ, dt * 6);
    }
    if (this.leverGearMesh && puzzleState.trustBridge.isBridgeLockedOpen) {
      this.leverGearMesh.rotation.z += dt * 1.5;
    }

    // Pressure plate depression
    if (this.pressurePlateDisc) {
      const targetDiscY = puzzleState.trustBridge.plateActive ? 0.02 : 0.1;
      this.pressurePlateDisc.position.y = THREE.MathUtils.lerp(this.pressurePlateDisc.position.y, targetDiscY, dt * 12);
    }

    // 2. Challenge 2: Moving Platform & Gyroscope Spire
    if (puzzleState.magicalCrossing.novaMechanismActive) {
      const p = puzzleState.magicalCrossing.movingPlatformProgress;
      const targetZ = 66 + Math.sin(p * Math.PI * 2) * 8.0;
      this.movingPlatformMesh.position.z = targetZ;
      if (this.movingPlatformBody) {
        this.movingPlatformBody.setTranslation({ x: 0, y: 1.5, z: targetZ }, true);
      }

      // Gyroscope rings spin energetically
      if (this.novaGyroOuter) this.novaGyroOuter.rotation.x += dt * 3.2;
      if (this.novaGyroInner) this.novaGyroInner.rotation.y += dt * 4.5;
    }

    // Lumi Starlight Platform
    if (puzzleState.magicalCrossing.lumiPlatformActive && puzzleState.magicalCrossing.lumiPlatformPosition) {
      const pos = puzzleState.magicalCrossing.lumiPlatformPosition;
      if (!this.lumiPlatformMesh) {
        // High quality prismatic starlight platform
        const lpGeom = new THREE.CylinderGeometry(1.6, 1.7, 0.25, 6);
        const lpMat = new THREE.MeshStandardMaterial({
          color: 0xffd166,
          emissive: 0xf28b9d,
          emissiveIntensity: 0.9,
          roughness: 0.1,
          metalness: 0.2,
          transparent: true,
          opacity: 0.88,
        });
        this.lumiPlatformMesh = new THREE.Mesh(lpGeom, lpMat);
        this.group.add(this.lumiPlatformMesh);

        // Rotating gold starlight rune ring
        const ringGeom = new THREE.TorusGeometry(1.75, 0.04, 6, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xffd54f, emissiveIntensity: 0.6 });
        this.lumiPlatformRing = new THREE.Mesh(ringGeom, ringMat);
        this.lumiPlatformRing.rotation.x = Math.PI / 2;
        this.lumiPlatformMesh.add(this.lumiPlatformRing);

        const { body } = this.physicsWorld.createKinematicBox(pos.x, pos.y, pos.z, 1.6, 0.15, 1.6);
        this.lumiPlatformBody = body;
      }
      this.lumiPlatformMesh.position.set(pos.x, pos.y, pos.z);
      this.lumiPlatformMesh.rotation.y += dt * 1.2;
      if (this.lumiPlatformRing) {
        this.lumiPlatformRing.rotation.z -= dt * 2.0;
      }
    } else {
      if (this.lumiPlatformMesh) {
        this.group.remove(this.lumiPlatformMesh);
        this.lumiPlatformMesh.geometry.dispose();
        this.lumiPlatformMesh = null;
        this.lumiPlatformRing = null;
      }
      if (this.lumiPlatformBody) {
        this.physicsWorld.removeRigidBody(this.lumiPlatformBody);
        this.lumiPlatformBody = null;
      }
    }

    // 3. Challenge 3: Heart Gate Sliding Doors & Conduits
    const gateProg = puzzleState.heartGate.gateOpenProgress;
    this.gateDoorLeft.position.x = -1.4 - gateProg * 2.6;
    this.gateDoorRight.position.x = 1.4 + gateProg * 2.6;

    if (this.gateColliderBody) {
      const doorOpen = gateProg > 0.7;
      this.gateColliderBody.setTranslation({ x: 0, y: doorOpen ? -15.0 : 4.5, z: 120 }, true);
    }

    // Conduits fill with light upon switch activation
    if (this.conduitLeft) {
      const mat = this.conduitLeft.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = puzzleState.heartGate.switch1Active ? 1.6 : 0.35;
    }
    if (this.conduitRight) {
      const mat = this.conduitRight.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = puzzleState.heartGate.switch2Active ? 1.6 : 0.35;
    }

    // 4. Waterfall animation
    for (const w of this.waterfalls) {
      w.mat.opacity = 0.8 + Math.sin(time * 6.0) * 0.08;
    }

    // 5. Environmental crystals & beacon glow
    for (const c of this.animatedCrystals) {
      c.rotation.y += dt * 0.75;
    }
    for (const r of this.beaconRings) {
      r.rotation.z += dt * 1.1;
    }

    // 6. Butterflies & Fireflies
    this.butterflies.forEach((b) => {
      const flutter = Math.sin(time * b.freq) * 0.7;
      b.wingL.rotation.y = flutter;
      b.wingR.rotation.y = flutter;
      b.group.position.x = b.basePos.x + Math.sin(time * 0.8) * 1.5;
      b.group.position.y = b.basePos.y + Math.cos(time * 1.2) * 0.5;
      b.group.position.z = b.basePos.z + Math.sin(time * 0.6) * 1.2;
    });

    this.fireflies.forEach((f) => {
      f.mesh.position.x = f.basePos.x + Math.sin(time + f.offset) * 0.8;
      f.mesh.position.y = f.basePos.y + Math.cos(time * 1.4 + f.offset) * 0.6;
      f.mesh.position.z = f.basePos.z + Math.sin(time * 0.7 + f.offset) * 0.8;
    });
  }
}
