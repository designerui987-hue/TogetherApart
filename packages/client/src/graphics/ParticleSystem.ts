import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleStart: number;
  scaleEnd: number;
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  rotationSpeed: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private heartGeometry: THREE.BufferGeometry;
  private sparkleGeometry: THREE.BufferGeometry;
  private ringGeometry: THREE.BufferGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.heartGeometry = this.createHeartGeometry();
    this.sparkleGeometry = new THREE.DodecahedronGeometry(0.12, 0);
    this.ringGeometry = new THREE.RingGeometry(0.2, 0.4, 24);
  }

  private createHeartGeometry(): THREE.BufferGeometry {
    // Procedural 2D Heart extruded slightly or drawn with Shape
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.25, y + 0.25);
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
    heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
    heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
    heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
    const geom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geom.center();
    geom.scale(0.35, -0.35, 0.35); // Flip upright
    return geom;
  }

  public emitHearts(position: THREE.Vector3, count: number = 14) {
    const pinkColor = new THREE.Color(0xff4081);
    const goldenColor = new THREE.Color(0xffd54f);

    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: pinkColor,
        emissive: pinkColor,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 1.0,
      });

      const mesh = new THREE.Mesh(this.heartGeometry, mat);
      mesh.position.copy(position);
      mesh.rotation.z = (Math.random() - 0.5) * 0.5;

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 2.0;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed * 0.6,
        2.0 + Math.random() * 2.0,
        Math.sin(angle) * speed * 0.6
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 1.4 + Math.random() * 0.5,
        scaleStart: 0.6 + Math.random() * 0.4,
        scaleEnd: 0.1,
        colorStart: pinkColor,
        colorEnd: goldenColor,
        rotationSpeed: (Math.random() - 0.5) * 4,
      });
    }
  }

  public emitSparkles(position: THREE.Vector3, count: number = 16, baseColor: number = 0xffe082) {
    const col = new THREE.Color(baseColor);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.9,
      });

      const mesh = new THREE.Mesh(this.sparkleGeometry, mat);
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2.5 + 0.5,
        (Math.random() - 0.5) * 3
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        scaleStart: 1.2,
        scaleEnd: 0.05,
        colorStart: col,
        colorEnd: new THREE.Color(0xffffff),
        rotationSpeed: (Math.random() - 0.5) * 6,
      });
    }
  }

  public emitPulseWave(position: THREE.Vector3, colorHex: number = 0x2ed8d8) {
    const col = new THREE.Color(colorHex);
    const mat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(this.ringGeometry, mat);
    mesh.position.copy(position);
    mesh.rotation.x = -Math.PI / 2;

    this.group.add(mesh);
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(0, 0.4, 0),
      life: 0,
      maxLife: 0.7,
      scaleStart: 0.2,
      scaleEnd: 6.5,
      colorStart: col,
      colorEnd: col,
      rotationSpeed: 0,
    });
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      const progress = p.life / p.maxLife;

      if (progress >= 1.0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 3.5 * dt; // Soft particle gravity
      p.mesh.rotation.y += p.rotationSpeed * dt;
      p.mesh.rotation.z += (p.rotationSpeed * 0.5) * dt;

      // Scale transition
      const curScale = THREE.MathUtils.lerp(p.scaleStart, p.scaleEnd, progress);
      p.mesh.scale.set(curScale, curScale, curScale);

      // Opacity fade
      const mat = p.mesh.material as THREE.Material & { opacity?: number };
      if (mat.opacity !== undefined) {
        mat.opacity = 1.0 - Math.pow(progress, 2);
      }
    }
  }
}
