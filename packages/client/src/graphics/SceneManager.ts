import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clouds: THREE.Group;
  private cloudMeshes: THREE.Mesh[] = [];

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    // Cozy atmospheric pastel fog
    this.scene.background = new THREE.Color(0xcfe4ff);
    this.scene.fog = new THREE.FogExp2(0xcfe4ff, 0.009);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 5, -8);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    container.appendChild(this.renderer.domElement);

    // Setup Lighting
    this.setupLighting();

    // Procedural Floating Clouds
    this.clouds = new THREE.Group();
    this.createProceduralClouds();
    this.scene.add(this.clouds);

    // Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting() {
    // Warm hemisphere ambient light: soft pastel sky, warm cream ground
    const hemiLight = new THREE.HemisphereLight(0xfff0f5, 0xcce0ff, 0.7);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Gentle golden-hour directional sun
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    dirLight.position.set(30, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    const d = 35;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Soft turquoise fill light from below for magical reflections
    const fillLight = new THREE.DirectionalLight(0x80deea, 0.35);
    fillLight.position.set(-20, -10, -20);
    this.scene.add(fillLight);
  }

  private createProceduralClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.75,
      flatShading: true,
    });

    for (let c = 0; c < 14; c++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < numPuffs; p++) {
        const radius = 2.5 + Math.random() * 3.5;
        const geom = new THREE.DodecahedronGeometry(radius, 1);
        const mesh = new THREE.Mesh(geom, cloudMat);
        mesh.position.set(
          (p - numPuffs / 2) * 3.2 + (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 2.5
        );
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        cloudGroup.add(mesh);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 180,
        15 + Math.random() * 25,
        Math.random() * 160 - 20
      );
      this.clouds.add(cloudGroup);
      this.cloudMeshes.push(cloudGroup as unknown as THREE.Mesh);
    }
  }

  public update(dt: number) {
    // Slowly drift clouds across the horizon
    for (const cloud of this.cloudMeshes) {
      cloud.position.x += dt * 1.2;
      if (cloud.position.x > 100) {
        cloud.position.x = -100;
      }
    }
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
