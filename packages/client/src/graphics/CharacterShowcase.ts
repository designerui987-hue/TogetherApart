import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AssetManager } from '../assets/AssetManager';

export interface ShowcaseStats {
  triangles: number;
  vertices: number;
  meshes: number;
  materials: number;
}

export class CharacterShowcase {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  // Models
  private currentCharacter: 'lumi' | 'nova' = 'lumi';
  private modelRoot: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName: string = 'Idle';
  private headMesh: THREE.Mesh | null = null;
  private morphTargetMap: Map<string, number> = new Map();

  // Lighting
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private groundMesh!: THREE.Mesh;

  // Settings
  private isTurntable: boolean = false;
  private turntableSpeed: number = 0.8;
  private isWireframe: boolean = false;
  private animSpeed: number = 1.0;
  private isPlaying: boolean = true;
  private animFrameId: number | null = null;

  public onStatsUpdated?: (stats: ShowcaseStats) => void;
  public onAnimationsLoaded?: (names: string[]) => void;
  public onMorphTargetsLoaded?: (names: string[]) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x11131c);
    this.scene.fog = new THREE.FogExp2(0x11131c, 0.04);

    // Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(1.4, 1.4, 2.6);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.9, 0);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 8.0;

    this.setupLighting();
    this.setupPedestal();

    // Resize listener
    window.addEventListener('resize', this.onResize);

    // Start render loop
    this.animate();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xfff3e0, 0x1a2030, 0.8);
    this.scene.add(this.hemiLight);

    // Key Light (Warm Sun)
    this.keyLight = new THREE.DirectionalLight(0xffecd2, 2.2);
    this.keyLight.position.set(3, 4, 3);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 15;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Fill Light (Soft Cool Cyan/Lavender)
    this.fillLight = new THREE.DirectionalLight(0xbadfff, 1.0);
    this.fillLight.position.set(-3, 2, 2);
    this.scene.add(this.fillLight);

    // Rim Light (Golden Backlight Silhouette)
    this.rimLight = new THREE.DirectionalLight(0xffdb99, 2.8);
    this.rimLight.position.set(0, 3, -3.5);
    this.scene.add(this.rimLight);
  }

  private setupPedestal() {
    // Pedestal disk
    const pedGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.1, 48);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1f2333,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.groundMesh = new THREE.Mesh(pedGeo, pedMat);
    this.groundMesh.position.y = -0.05;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Decorative magical ring
    const ringGeo = new THREE.RingGeometry(1.28, 1.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd175,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    this.scene.add(ring);
  }

  public async loadCharacter(char: 'lumi' | 'nova') {
    this.currentCharacter = char;

    if (this.modelRoot) {
      this.scene.remove(this.modelRoot);
      this.modelRoot = null;
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.actions.clear();
    this.morphTargetMap.clear();
    this.headMesh = null;

    const url = `/assets/characters/${char}/${char}_v2.glb`;
    const instance = await AssetManager.getInstance().instantiateModel(url, 'character');

    if (instance.root) {
      this.modelRoot = instance.root;
      this.modelRoot.position.set(0, 0, 0);
      this.scene.add(this.modelRoot);

      // Find Head mesh with Morph Targets
      this.modelRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            this.headMesh = mesh;
            for (const [name, idx] of Object.entries(mesh.morphTargetDictionary)) {
              this.morphTargetMap.set(name, idx);
            }
          }
        }
      });

      // Animation Mixer
      if (instance.animations && instance.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.modelRoot);
        const actionNames: string[] = [];
        for (const clip of instance.animations) {
          const act = this.mixer.clipAction(clip);
          this.actions.set(clip.name, act);
          actionNames.push(clip.name);
        }

        if (this.onAnimationsLoaded) {
          this.onAnimationsLoaded(actionNames);
        }

        // Play Idle by default
        this.playAnimation('Idle');
      }

      if (this.onMorphTargetsLoaded) {
        this.onMorphTargetsLoaded(Array.from(this.morphTargetMap.keys()));
      }

      // Compute statistics
      this.computeStats();
    }
  }

  public setViewPreset(preset: 'hero' | 'front' | 'side' | 'back' | 'face' | 'detail') {
    switch (preset) {
      case 'hero':
        this.camera.position.set(1.4, 1.4, 2.4);
        this.controls.target.set(0, 0.9, 0);
        break;
      case 'front':
        this.camera.position.set(0, 1.0, 2.8);
        this.controls.target.set(0, 0.9, 0);
        break;
      case 'side':
        this.camera.position.set(2.8, 1.0, 0);
        this.controls.target.set(0, 0.9, 0);
        break;
      case 'back':
        this.camera.position.set(0, 1.0, -2.8);
        this.controls.target.set(0, 0.9, 0);
        break;
      case 'face':
        this.camera.position.set(0.35, 1.42, 0.9);
        this.controls.target.set(0, 1.35, 0);
        break;
      case 'detail':
        if (this.currentCharacter === 'lumi') {
          // Wings & Scarf back 3/4
          this.camera.position.set(0.8, 1.1, -1.2);
          this.controls.target.set(0, 1.0, 0);
        } else {
          // Gauntlet front 3/4
          this.camera.position.set(0.8, 0.8, 1.0);
          this.controls.target.set(0.4, 0.75, 0);
        }
        break;
    }
    this.controls.update();
  }

  public playAnimation(name: string, crossFadeDuration: number = 0.25) {
    if (!this.mixer) return;
    const nextAction = this.actions.get(name);
    const prevAction = this.actions.get(this.currentActionName);

    if (nextAction) {
      if (prevAction && prevAction !== nextAction) {
        prevAction.crossFadeTo(nextAction, crossFadeDuration, true);
      }
      nextAction.reset().play();
      this.currentActionName = name;
    }
  }

  public setAnimationSpeed(speed: number) {
    this.animSpeed = speed;
    if (this.mixer) {
      this.mixer.timeScale = this.isPlaying ? this.animSpeed : 0;
    }
  }

  public togglePlayPause(): boolean {
    this.isPlaying = !this.isPlaying;
    if (this.mixer) {
      this.mixer.timeScale = this.isPlaying ? this.animSpeed : 0;
    }
    return this.isPlaying;
  }

  public setMorphTargetValue(name: string, value: number) {
    if (!this.headMesh || !this.headMesh.morphTargetInfluences) return;
    const idx = this.morphTargetMap.get(name);
    if (idx !== undefined) {
      this.headMesh.morphTargetInfluences[idx] = THREE.MathUtils.clamp(value, 0, 1);
    }
  }

  public toggleTurntable(enabled?: boolean): boolean {
    this.isTurntable = enabled !== undefined ? enabled : !this.isTurntable;
    return this.isTurntable;
  }

  public setTurntableSpeed(speed: number) {
    this.turntableSpeed = speed;
  }

  public toggleWireframe(enabled?: boolean): boolean {
    this.isWireframe = enabled !== undefined ? enabled : !this.isWireframe;
    if (this.modelRoot) {
      this.modelRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => ((m as THREE.MeshStandardMaterial).wireframe = this.isWireframe));
          } else {
            (mesh.material as THREE.MeshStandardMaterial).wireframe = this.isWireframe;
          }
        }
      });
    }
    return this.isWireframe;
  }

  private computeStats() {
    let triangles = 0;
    let vertices = 0;
    let meshes = 0;
    const materialSet = new Set<THREE.Material>();

    if (this.modelRoot) {
      this.modelRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry) {
          meshes++;
          const geo = mesh.geometry;
          if (geo.index) {
            triangles += geo.index.count / 3;
          } else if (geo.attributes.position) {
            triangles += geo.attributes.position.count / 3;
          }
          if (geo.attributes.position) {
            vertices += geo.attributes.position.count;
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => materialSet.add(m));
            } else {
              materialSet.add(mesh.material);
            }
          }
        }
      });
    }

    if (this.onStatsUpdated) {
      this.onStatsUpdated({
        triangles: Math.round(triangles),
        vertices: Math.round(vertices),
        meshes,
        materials: materialSet.size,
      });
    }
  }

  private onResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();

    if (this.mixer && this.isPlaying) {
      this.mixer.update(dt * this.animSpeed);
    }

    if (this.isTurntable && this.modelRoot) {
      this.modelRoot.rotation.y += dt * this.turntableSpeed;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
