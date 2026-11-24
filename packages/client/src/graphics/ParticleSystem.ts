import * as THREE from 'three';

export interface PooledParticle {
  active: boolean;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleStart: number;
  scaleEnd: number;
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  rotationSpeed: number;
  gravityFactor: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private pool: PooledParticle[] = [];
  private poolSize: number = 300;

  // Shared reusable geometries
  private heartGeometry: THREE.BufferGeometry;
  private starGeometry: THREE.BufferGeometry;
  private dustGeometry: THREE.BufferGeometry;
  private ringGeometry: THREE.BufferGeometry;

  // Shared materials by effect type to avoid shader compilation hitching
  private heartMaterial: THREE.MeshStandardMaterial;
  private starMaterial: THREE.MeshBasicMaterial;
  private dustMaterial: THREE.MeshStandardMaterial;
  private ringMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.heartGeometry = this.createHeartGeometry();
    this.starGeometry = new THREE.DodecahedronGeometry(0.12, 0);
    this.dustGeometry = new THREE.IcosahedronGeometry(0.16, 0);
    this.ringGeometry = new THREE.RingGeometry(0.2, 0.42, 24);

    this.heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xf28b9d,
      emissive: 0xf28b9d,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 1.0,
    });

    this.starMaterial = new THREE.MeshBasicMaterial({
      color: 0xf3cd82,
      transparent: true,
      opacity: 0.95,
    });

    this.dustMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfd7bf,
      roughness: 0.9,
      transparent: true,
      opacity: 0.65,
    });

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x56c5d5,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    this.initPool();
  }

  private createHeartGeometry(): THREE.BufferGeometry {
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0.25, 0.25);
    heartShape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
    heartShape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
    heartShape.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
    heartShape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
    heartShape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
    heartShape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
    const geom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geom.center();
    geom.scale(0.32, -0.32, 0.32);
    return geom;
  }

  private initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      // Default placeholder mesh
      const mesh = new THREE.Mesh(this.starGeometry, this.starMaterial.clone());
      mesh.visible = false;
      this.group.add(mesh);

      this.pool.push({
        active: false,
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0,
        scaleStart: 1.0,
        scaleEnd: 0.1,
        colorStart: new THREE.Color(),
        colorEnd: new THREE.Color(),
        rotationSpeed: 0,
        gravityFactor: 1.0,
      });
    }
  }

  private getFreeParticle(): PooledParticle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    // Recycle oldest if pool is fully saturated
    return this.pool[0];
  }

  public emitHearts(position: THREE.Vector3, count: number = 18) {
    const pink = new THREE.Color(0xf28b9d);
    const golden = new THREE.Color(0xf3cd82);

    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.geometry = this.heartGeometry;
      p.mesh.material = this.heartMaterial.clone();
      p.mesh.position.copy(position);

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 1.8 + Math.random() * 2.4;
      p.velocity.set(
        Math.cos(angle) * speed * 0.7,
        2.2 + Math.random() * 2.5,
        Math.sin(angle) * speed * 0.7
      );

      p.life = 0;
      p.maxLife = 1.5 + Math.random() * 0.5;
      p.scaleStart = 0.8 + Math.random() * 0.4;
      p.scaleEnd = 0.1;
      p.colorStart.copy(pink);
      p.colorEnd.copy(golden);
      p.rotationSpeed = (Math.random() - 0.5) * 5;
      p.gravityFactor = -0.4; // Upward floating buoyancy
    }
  }

  public emitSparkles(position: THREE.Vector3, count: number = 16, baseColor: number = 0xf3cd82) {
    const col = new THREE.Color(baseColor);
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.geometry = this.starGeometry;
      const mat = this.starMaterial.clone();
      mat.color.copy(col);
      p.mesh.material = mat;
      p.mesh.position.copy(position);

      p.velocity.set(
        (Math.random() - 0.5) * 2.8,
        Math.random() * 2.2 + 0.6,
        (Math.random() - 0.5) * 2.8
      );

      p.life = 0;
      p.maxLife = 0.85 + Math.random() * 0.4;
      p.scaleStart = 1.1;
      p.scaleEnd = 0.05;
      p.colorStart.copy(col);
      p.colorEnd.set(0xffffff);
      p.rotationSpeed = (Math.random() - 0.5) * 6;
      p.gravityFactor = 1.8;
    }
  }

  public emitPulseWave(position: THREE.Vector3, colorHex: number = 0x56c5d5) {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.mesh.visible = true;
    p.mesh.geometry = this.ringGeometry;
    const mat = this.ringMaterial.clone();
    mat.color.setHex(colorHex);
    p.mesh.material = mat;
    p.mesh.position.copy(position);
    p.mesh.rotation.x = -Math.PI / 2;

    p.velocity.set(0, 0.25, 0);
    p.life = 0;
    p.maxLife = 0.7;
    p.scaleStart = 0.3;
    p.scaleEnd = 7.5;
    p.colorStart.setHex(colorHex);
    p.colorEnd.setHex(colorHex);
    p.rotationSpeed = 0;
    p.gravityFactor = 0;
  }

  public emitJumpDust(position: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.geometry = this.dustGeometry;
      p.mesh.material = this.dustMaterial.clone();
      p.mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.1,
        position.z + (Math.random() - 0.5) * 0.4
      );

      p.velocity.set((Math.random() - 0.5) * 1.5, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 1.5);
      p.life = 0;
      p.maxLife = 0.5;
      p.scaleStart = 0.4;
      p.scaleEnd = 1.2;
      p.rotationSpeed = (Math.random() - 0.5) * 2;
      p.gravityFactor = -0.1;
    }
  }

  public emitSprintTrail(position: THREE.Vector3, colorHex: number = 0xf3cd82) {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.mesh.visible = true;
    p.mesh.geometry = this.starGeometry;
    const mat = this.starMaterial.clone();
    mat.color.setHex(colorHex);
    p.mesh.material = mat;
    p.mesh.position.set(position.x, position.y + 0.15, position.z);

    p.velocity.set(0, 0.3, 0);
    p.life = 0;
    p.maxLife = 0.4;
    p.scaleStart = 0.6;
    p.scaleEnd = 0.05;
    p.rotationSpeed = 1.0;
    p.gravityFactor = 0;
  }

  public emitVictoryFireworks(position: THREE.Vector3) {
    const colors = [0xf28b9d, 0x56c5d5, 0xf3cd82, 0xb6a1e4];
    colors.forEach((col, idx) => {
      const offsetPos = position.clone().add(new THREE.Vector3((idx - 1.5) * 2.5, idx * 0.8, 0));
      this.emitHearts(offsetPos, 12);
      this.emitSparkles(offsetPos, 16, col);
    });
  }

  public update(dt: number) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      const progress = p.life / p.maxLife;

      if (progress >= 1.0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      // Physics
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 3.2 * p.gravityFactor * dt;
      p.mesh.rotation.y += p.rotationSpeed * dt;

      // Scale
      const scale = THREE.MathUtils.lerp(p.scaleStart, p.scaleEnd, progress);
      p.mesh.scale.set(scale, scale, scale);

      // Opacity fade
      const mat = p.mesh.material as THREE.Material & { opacity?: number };
      if (mat.opacity !== undefined) {
        mat.opacity = 1.0 - Math.pow(progress, 2);
      }
    }
  }
}
