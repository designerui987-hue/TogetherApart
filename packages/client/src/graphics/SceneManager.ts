import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface PerformanceStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

// Custom Vignette and Warm Pastel Color Grade Shader
const VignetteColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.05 },
    darkness: { value: 1.15 },
    warmth: { value: 0.04 },
    saturation: { value: 1.06 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    uniform float warmth;
    uniform float saturation;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      
      // Warm tinting in midtones & highlights
      texel.r += warmth * 0.9;
      texel.g += warmth * 0.4;
      texel.b -= warmth * 0.3;

      // Saturation adjustment
      float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
      texel.rgb = mix(vec3(luminance), texel.rgb, saturation);

      // Smooth vignette
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float dist = dot(uv, uv);
      texel.rgb *= clamp(1.0 - dist * (darkness - 1.0), 0.0, 1.0);

      gl_FragColor = texel;
    }
  `,
};

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer!: EffectComposer;
  
  // Lighting
  private dirSunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private fillLight!: THREE.DirectionalLight;

  // Post-processing passes
  private renderPass!: RenderPass;
  private bloomPass!: UnrealBloomPass;
  private colorGradePass!: ShaderPass;
  private outputPass!: OutputPass;

  // Sky & Environment
  private skyDome!: THREE.Mesh;
  private clouds: THREE.Group;
  private cloudMeshes: THREE.Group[] = [];

  // Quality & Performance
  public currentPreset: QualityPreset = 'high';
  private frameCount: number = 0;
  private lastFpsUpdate: number = performance.now();
  private currentFps: number = 60;
  private currentFrameTime: number = 16.6;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    // Atmospheric romantic dusk/daybreak fog
    const fogColor = new THREE.Color(0xd6e0f5);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0075);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 5, -8);

    // High performance WebGL renderer with proper color management
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    // Setup Lighting & Sky Dome
    this.setupLighting();
    this.createSkyDome();

    // Procedural Layered Clouds
    this.clouds = new THREE.Group();
    this.createLayeredClouds();
    this.scene.add(this.clouds);

    // Setup Post-processing pipeline
    this.setupPostProcessing();

    // Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting() {
    // Warm hemisphere ambient light: soft peach sky, turquoise/mint ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xffe8df, 0x82c8c4, 0.7);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    // Golden-hour key directional sun
    this.dirSunLight = new THREE.DirectionalLight(0xfff3db, 1.35);
    this.dirSunLight.position.set(38, 55, 24);
    this.dirSunLight.castShadow = true;
    this.dirSunLight.shadow.mapSize.width = 2048;
    this.dirSunLight.shadow.mapSize.height = 2048;
    this.dirSunLight.shadow.camera.near = 1.0;
    this.dirSunLight.shadow.camera.far = 180;
    const d = 42;
    this.dirSunLight.shadow.camera.left = -d;
    this.dirSunLight.shadow.camera.right = d;
    this.dirSunLight.shadow.camera.top = d;
    this.dirSunLight.shadow.camera.bottom = -d;
    this.dirSunLight.shadow.bias = -0.0002;
    this.dirSunLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirSunLight);

    // Soft lavender rim/accent light from the opposite horizon
    this.fillLight = new THREE.DirectionalLight(0xbfa8e8, 0.45);
    this.fillLight.position.set(-30, 20, -35);
    this.scene.add(this.fillLight);
  }

  private createSkyDome() {
    // Procedural gradient sky dome with sunrise peach -> mystical lavender -> deep celestial azure
    const skyGeo = new THREE.SphereGeometry(450, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x6096fd) },     // Azure sky
        midColor: { value: new THREE.Color(0xbfa8e8) },     // Magic lavender
        bottomColor: { value: new THREE.Color(0xffd6ba) },  // Warm sunrise peach
        offset: { value: 35.0 },
        exponent: { value: 0.65 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          float factor = max(0.0, h);
          vec3 color = factor < 0.4 
            ? mix(bottomColor, midColor, factor / 0.4) 
            : mix(midColor, topColor, pow((factor - 0.4) / 0.6, exponent));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  private createLayeredClouds() {
    const cloudMatUpper = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      flatShading: true,
    });

    const cloudMatLower = new THREE.MeshStandardMaterial({
      color: 0xf6e5f5, // Soft lavender tint
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.6,
      flatShading: true,
    });

    // 16 stylized cloud clusters placed at varied elevations and depths
    for (let c = 0; c < 18; c++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 5 + Math.floor(Math.random() * 5);
      const isLow = c % 2 === 0;

      for (let p = 0; p < numPuffs; p++) {
        const radius = 3.0 + Math.random() * 4.0;
        const geom = new THREE.DodecahedronGeometry(radius, 1);
        const mesh = new THREE.Mesh(geom, isLow ? cloudMatLower : cloudMatUpper);
        mesh.position.set(
          (p - numPuffs / 2) * 3.6 + (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 3.0
        );
        mesh.scale.set(1.2, 0.75, 1.0); // Slightly flattened fluffy cloud look
        cloudGroup.add(mesh);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 220,
        isLow ? -6 + Math.random() * 12 : 25 + Math.random() * 30,
        Math.random() * 200 - 30
      );

      this.clouds.add(cloudGroup);
      this.cloudMeshes.push(cloudGroup);
    }
  }

  private setupPostProcessing() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Multi-sample render target for smooth anti-aliased geometry
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
      samples: 4,
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);

    // 1. Scene Base Pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2. Selective Dreamy Bloom Pass (Tuned so crystals & starlight glow warmly without blowing out geometry)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.45,  // Bloom Strength
      0.55,  // Bloom Radius
      0.82   // Bloom Threshold (Selective)
    );
    this.composer.addPass(this.bloomPass);

    // 3. Custom Color Grade & Soft Vignette Pass
    this.colorGradePass = new ShaderPass(VignetteColorGradeShader);
    this.composer.addPass(this.colorGradePass);

    // 4. Output Tone-mapping pass
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  public setQualityPreset(preset: QualityPreset) {
    this.currentPreset = preset;
    console.log(`[SceneManager] Switching graphics quality preset to: ${preset.toUpperCase()}`);

    switch (preset) {
      case 'low':
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.enabled = false;
        this.bloomPass.enabled = false;
        this.colorGradePass.enabled = false;
        break;

      case 'medium':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.shadowMap.enabled = true;
        this.dirSunLight.shadow.mapSize.set(1024, 1024);
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.35;
        this.colorGradePass.enabled = false;
        break;

      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        this.renderer.shadowMap.enabled = true;
        this.dirSunLight.shadow.mapSize.set(2048, 2048);
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.45;
        this.colorGradePass.enabled = true;
        break;

      case 'ultra':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        this.renderer.shadowMap.enabled = true;
        this.dirSunLight.shadow.mapSize.set(2048, 2048);
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.55;
        this.colorGradePass.enabled = true;
        break;
    }

    if (this.dirSunLight.shadow.map) {
      this.dirSunLight.shadow.map.dispose();
      this.dirSunLight.shadow.map = null as any;
    }
  }

  public update(dt: number) {
    // Performance metrics calculation
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.currentFrameTime = +(elapsed / this.frameCount).toFixed(1);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Slowly drift clouds across horizon
    for (const cloud of this.cloudMeshes) {
      cloud.position.x += dt * 1.1;
      if (cloud.position.x > 120) {
        cloud.position.x = -120;
      }
    }

    // Sky dome follows camera position to preserve celestial horizon
    if (this.skyDome) {
      this.skyDome.position.copy(this.camera.position);
    }
  }

  public render() {
    if (this.currentPreset === 'low') {
      // Direct render path for maximum low-end performance
      this.renderer.render(this.scene, this.camera);
    } else {
      // Post-processing composite pipeline
      this.composer.render();
    }
  }

  public getPerformanceStats(): PerformanceStats {
    const memory = (this.renderer.info as any).memory || {};
    return {
      fps: this.currentFps,
      frameTimeMs: this.currentFrameTime,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: memory.geometries || 0,
      textures: memory.textures || 0,
    };
  }

  private onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }
}
