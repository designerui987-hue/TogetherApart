import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private yaw: number = 0;
  private pitch: number = 0.25;
  private distance: number = 6.0;
  private currentTarget: THREE.Vector3 = new THREE.Vector3();
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentCameraPos.copy(this.camera.position);
  }

  public updateSolo(
    targetPosition: THREE.Vector3,
    deltaX: number,
    deltaY: number,
    dt: number
  ) {
    const sensitivity = 0.0024;
    this.yaw -= deltaX * sensitivity;
    this.pitch += deltaY * sensitivity;

    // Clamp vertical camera pitch
    this.pitch = Math.max(-0.25, Math.min(1.2, this.pitch));

    // Smooth target follow
    this.currentTarget.lerp(targetPosition, 1 - Math.exp(-12 * dt));

    // Compute ideal camera position in spherical coordinates
    const horizontalDist = this.distance * Math.cos(this.pitch);
    const verticalDist = this.distance * Math.sin(this.pitch);

    const targetCamX = this.currentTarget.x - Math.sin(this.yaw) * horizontalDist;
    const targetCamY = this.currentTarget.y + verticalDist + 1.2;
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

  public updateDual(
    pos1: THREE.Vector3,
    pos2: THREE.Vector3,
    dt: number
  ) {
    // Dynamic framing camera for local co-op: frame midpoint between players
    const midpoint = new THREE.Vector3()
      .addVectors(pos1, pos2)
      .multiplyScalar(0.5);

    const playerDist = pos1.distanceTo(pos2);
    const dynamicDist = Math.max(7.5, Math.min(22.0, playerDist * 1.35 + 4.0));

    this.currentTarget.lerp(midpoint, 1 - Math.exp(-8 * dt));

    const desiredCamPos = new THREE.Vector3(
      this.currentTarget.x,
      this.currentTarget.y + dynamicDist * 0.65 + 2.0,
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

  public getYaw(): number {
    return this.yaw;
  }
}
