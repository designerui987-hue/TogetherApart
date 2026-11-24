import RAPIER from '@dimforge/rapier3d-compat';
import { PHYSICS } from '@together-apart/shared';

export class PhysicsWorld {
  public world!: RAPIER.World;
  private initialized: boolean = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    await RAPIER.init();
    const gravity = { x: 0.0, y: PHYSICS.GRAVITY, z: 0.0 };
    this.world = new RAPIER.World(gravity);
    this.initialized = true;
    console.log('[PhysicsWorld] Rapier 3D initialized successfully.');
  }

  public step() {
    if (this.world) {
      this.world.step();
    }
  }

  public createStaticBox(
    x: number, y: number, z: number,
    halfWidth: number, halfHeight: number, halfDepth: number,
    isSensor: boolean = false
  ): { body: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth).setSensor(isSensor);
    const collider = this.world.createCollider(colliderDesc, body);
    return { body, collider };
  }

  public createKinematicBox(
    x: number, y: number, z: number,
    halfWidth: number, halfHeight: number, halfDepth: number
  ): { body: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth);
    const collider = this.world.createCollider(colliderDesc, body);
    return { body, collider };
  }

  public removeRigidBody(body: RAPIER.RigidBody) {
    if (this.world && body) {
      this.world.removeRigidBody(body);
    }
  }
}
