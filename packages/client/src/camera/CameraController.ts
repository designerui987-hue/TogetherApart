import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private yaw: number = 0;
  private pitch: number = 0.28;
  private distance: number = 5.8;
  private currentTarget: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3(0, 5, -8);

  // Sprint FOV & Reduced Motion
  public reducedMotion: boolean = false;
  private targetFov: number = 58;
  private currentFov: number = 58;

  // Menu showcase orbit
  private menuOrbitAngle: number = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentCameraPos.copy(this.camera.position);
  }

  public updateSolo(
    targetPosition: THREE.Vector3,
    deltaX: number,
    deltaY: number,
    dt: number,
    isSprinting: boolean = false
  ) {
    const sensitivity = this.reducedMotion ? 0.0016 : 0.0024;
    this.yaw -= deltaX * sensitivity;
    this.pitch += deltaY * sensitivity;

    // Pitch clamping
    this.pitch = Math.max(-0.25, Math.min(1.15, this.pitch));

    // Dynamic FOV interpolation
    this.targetFov = (isSprinting && !this.reducedMotion) ? 64 : 58;
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, this.targetFov, dt * 6);
    if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // Smooth target follow
    const followRate = this.reducedMotion ? 8 : 12;
    this.currentTarget.lerp(targetPosition, 1 - Math.exp(-followRate * dt));

    // Spherical coordinates with ground collision clamping
    const horizontalDist = this.distance * Math.cos(this.pitch);
    const verticalDist = this.distance * Math.sin(this.pitch);

    const targetCamX = this.currentTarget.x - Math.sin(this.yaw) * horizontalDist;
    const targetCamY = Math.max(0.5, this.currentTarget.y + verticalDist + 1.2);
    const targetCamZ = this.currentTarget.z - Math.cos(this.yaw) * horizontalDist;

    const desiredPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
    this.currentCameraPos.lerp(desiredPos, 1 - Math.exp(-14 * dt));

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(
      this.currentTarget.x,
      this.currentTarget.y + 0.9,
      this.currentTarget.z
    );
  }

  public updateDual(pos1: THREE.Vector3, pos2: THREE.Vector3, dt: number) {
    // Dynamic co-op framing camera: midpoint between players
    const midpoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
    const playerDist = pos1.distanceTo(pos2);
    const dynamicDist = Math.max(7.5, Math.min(22.0, playerDist * 1.35 + 4.0));

    this.currentTarget.lerp(midpoint, 1 - Math.exp(-8 * dt));

    const desiredCamPos = new THREE.Vector3(
      this.currentTarget.x,
      this.currentTarget.y + dynamicDist * 0.62 + 2.0,
      this.currentTarget.z - dynamicDist * 0.85
    );

    this.currentCameraPos.lerp(desiredCamPos, 1 - Math.exp(-8 * dt));
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(
      this.currentTarget.x,
      this.currentTarget.y + 1.0,
      this.currentTarget.z
    );
  }

  public updateMenuOrbit(dt: number) {
    // Cinematic slow orbit around Arrival Meadow
    this.menuOrbitAngle += dt * 0.12;
    const radius = 14.0;
    const targetX = Math.sin(this.menuOrbitAngle) * radius;
    const targetZ = Math.cos(this.menuOrbitAngle) * radius + 4.0;
    const targetY = 5.5 + Math.sin(this.menuOrbitAngle * 0.5) * 1.2;

    this.currentCameraPos.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 4);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(0, 1.8, 4.0);
  }

  public getYaw(): number {
    return this.yaw;
  }
}
