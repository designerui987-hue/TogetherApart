import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { ABILITIES, CharacterType, EmoteType, PHYSICS, Vector3D } from '@together-apart/shared';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { CharacterModel } from './CharacterModel';
import { soundSynth } from '../audio/SoundSynth';
import { ParticleSystem } from '../graphics/ParticleSystem';

export class PlayerController {
  public id: string;
  public characterType: CharacterType;
  public model: CharacterModel;
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotation: THREE.Quaternion = new THREE.Quaternion();
  
  public isGrounded: boolean = true;
  public isMoving: boolean = false;
  public checkpointId: number = 0;

  // Rapier physics
  public rigidBody!: RAPIER.RigidBody;
  public collider!: RAPIER.Collider;

  // Movement & Jump feel
  private coyoteTimer: number = 0;
  private abilityCooldown: number = 0;
  private footstepTimer: number = 0;
  private physicsWorld: PhysicsWorld;
  private particles: ParticleSystem;

  constructor(
    id: string,
    characterType: CharacterType,
    spawnPos: Vector3D,
    physicsWorld: PhysicsWorld,
    particles: ParticleSystem
  ) {
    this.id = id;
    this.characterType = characterType;
    this.physicsWorld = physicsWorld;
    this.particles = particles;
    this.model = new CharacterModel(characterType);

    this.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
    this.model.group.position.copy(this.position);

    this.initPhysics();
  }

  private initPhysics() {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
      .setTranslation(this.position.x, this.position.y, this.position.z);
    this.rigidBody = this.physicsWorld.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(
      PHYSICS.CHARACTER_HEIGHT * 0.35,
      PHYSICS.CHARACTER_RADIUS
    );
    this.collider = this.physicsWorld.world.createCollider(colliderDesc, this.rigidBody);
  }

  public update(
    input: { forward: number; right: number; jump: boolean; jumpPressed: boolean; sprint: boolean; ability: boolean },
    cameraYaw: number,
    dt: number,
    onAbilityTriggered?: (type: 'platform' | 'pulse', pos: Vector3D) => void
  ) {
    // 1. Ability Cooldown
    if (this.abilityCooldown > 0) {
      this.abilityCooldown -= dt;
    }

    // 2. Ability Activation
    if (input.ability && this.abilityCooldown <= 0) {
      this.triggerAbility(onAbilityTriggered);
    }

    // 3. Ground detection raycast
    const trans = this.rigidBody.translation();
    const ray = new RAPIER.Ray(
      { x: trans.x, y: trans.y + 0.1, z: trans.z },
      { x: 0, y: -1, z: 0 }
    );
    const hit = this.physicsWorld.world.castRay(
      ray,
      0.65,
      true,
      undefined,
      undefined,
      this.collider
    );

    const wasGrounded = this.isGrounded;
    this.isGrounded = hit !== null && hit.timeOfImpact <= 0.55;

    // Detect landing impact for squash/stretch and dust VFX
    if (!wasGrounded && this.isGrounded) {
      this.model.triggerLandingSquash();
      this.particles.emitSparkles(this.position, 10, 0xdfd7bf); // Landing dust
    }

    // Coyote time logic
    if (this.isGrounded) {
      this.coyoteTimer = PHYSICS.COYOTE_TIME_MS / 1000;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // 4. Movement Calculation
    const moveSpeed = input.sprint ? PHYSICS.SPRINT_SPEED : PHYSICS.WALK_SPEED;
    const inputVec = new THREE.Vector3(input.right, 0, input.forward);
    const curRot = this.model.group.rotation.y;
    let targetAngle = curRot;

    if (inputVec.lengthSq() > 0.01) {
      inputVec.normalize();
      // Orient input relative to camera
      inputVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      this.isMoving = true;

      // Rotate model towards movement direction
      targetAngle = Math.atan2(inputVec.x, inputVec.z);
      this.model.group.rotation.y = THREE.MathUtils.lerp(
        curRot,
        targetAngle,
        1 - Math.exp(-15 * dt)
      );

      // Footstep sounds
      this.footstepTimer += dt * (input.sprint ? 1.5 : 1.0);
      if (input.sprint && this.isGrounded && Math.random() < 0.3) {
        this.particles.emitSprintTrail(this.position, this.characterType === 'lumi' ? 0xf28b9d : 0x56c5d5);
      }
      if (this.isGrounded && this.footstepTimer > 0.38) {
        soundSynth.playStep();
        this.footstepTimer = 0;
      }
    } else {
      this.isMoving = false;
      this.footstepTimer = 0;
    }

    // Smooth horizontal acceleration & deceleration
    const targetVelX = inputVec.x * moveSpeed;
    const targetVelZ = inputVec.z * moveSpeed;
    const accelRate = this.isGrounded ? PHYSICS.ACCELERATION : PHYSICS.ACCELERATION * PHYSICS.AIR_CONTROL;

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVelX, accelRate, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVelZ, accelRate, dt);

    // 5. Jump logic with Coyote Time & Jump Buffering
    if (input.jumpPressed && (this.isGrounded || this.coyoteTimer > 0)) {
      this.velocity.y = PHYSICS.JUMP_FORCE;
      this.coyoteTimer = 0;
      this.isGrounded = false;
      soundSynth.playJump();
      this.particles.emitJumpDust(this.position);
    } else if (!this.isGrounded) {
      // Gravity application
      this.velocity.y += PHYSICS.GRAVITY * dt;
    } else if (this.velocity.y < 0) {
      this.velocity.y = 0;
    }

    // Set kinematic velocity
    this.rigidBody.setLinvel({ x: this.velocity.x, y: this.velocity.y, z: this.velocity.z }, true);

    // Sync Three.js position
    const currentPos = this.rigidBody.translation();
    this.position.set(currentPos.x, currentPos.y, currentPos.z);
    this.model.group.position.copy(this.position);
    this.rotation.copy(this.model.group.quaternion);

    // Procedural animation with speed ratio and banking turn rate
    const speedRatio = input.sprint ? 1.5 : (this.isMoving ? 1.0 : 0.0);
    const turnRate = this.velocity.length() > 0.5 ? (targetAngle - curRot) : 0;
    this.model.animate(performance.now() * 0.001, this.isMoving, this.isGrounded, dt, speedRatio, turnRate);
  }

  private triggerAbility(onAbilityTriggered?: (type: 'platform' | 'pulse', pos: Vector3D) => void) {
    this.model.triggerAbility();
    if (this.characterType === 'lumi') {
      this.abilityCooldown = ABILITIES.LUMI_PLATFORM_COOLDOWN_SEC;
      soundSynth.playLumiPlatform();

      // Platform spawns 2.2m forward and 0.2m lower/level
      const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.model.group.rotation.y
      );
      const spawnPos = this.position.clone().add(forwardDir.multiplyScalar(2.2));
      spawnPos.y = Math.max(0.5, this.position.y - 0.2);

      this.particles.emitSparkles(spawnPos, 20, 0xffd54f);

      if (onAbilityTriggered) {
        onAbilityTriggered('platform', { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z });
      }
    } else {
      this.abilityCooldown = ABILITIES.NOVA_PULSE_COOLDOWN_SEC;
      soundSynth.playNovaPulse();
      this.particles.emitPulseWave(this.position, 0x2ed8d8);

      if (onAbilityTriggered) {
        onAbilityTriggered('pulse', { x: this.position.x, y: this.position.y, z: this.position.z });
      }
    }
  }

  public triggerEmote(emote: EmoteType) {
    switch (emote) {
      case 'wave': this.model.triggerWave(); break;
      case 'highfive': this.model.triggerHighFive(); break;
      case 'hug': this.model.triggerHug(); break;
      case 'dance': this.model.triggerDance(); break;
      case 'celebrate': this.model.celebrate(); break;
    }
  }

  public teleport(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.rigidBody.setTranslation({ x, y, z }, true);
    this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.model.group.position.copy(this.position);
  }

  public getCooldownPercent(): number {
    const max = this.characterType === 'lumi' 
      ? ABILITIES.LUMI_PLATFORM_COOLDOWN_SEC 
      : ABILITIES.NOVA_PULSE_COOLDOWN_SEC;
    return Math.max(0, Math.min(1, this.abilityCooldown / max));
  }
}
