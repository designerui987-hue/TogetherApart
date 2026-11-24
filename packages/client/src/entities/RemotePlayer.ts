import * as THREE from 'three';
import { CharacterType, EmoteType, TransformState } from '@together-apart/shared';
import { CharacterModel } from './CharacterModel';

export class RemotePlayer {
  public id: string;
  public name: string;
  public characterType: CharacterType;
  public model: CharacterModel;
  
  public position: THREE.Vector3 = new THREE.Vector3();
  public targetPosition: THREE.Vector3 = new THREE.Vector3();
  public targetRotation: THREE.Quaternion = new THREE.Quaternion();
  public isMoving: boolean = false;
  public isGrounded: boolean = true;

  constructor(id: string, name: string, characterType: CharacterType, spawnPos: { x: number; y: number; z: number }) {
    this.id = id;
    this.name = name;
    this.characterType = characterType;
    this.model = new CharacterModel(characterType);

    this.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
    this.targetPosition.copy(this.position);
    this.model.group.position.copy(this.position);
  }

  public updateState(transform: TransformState, isGrounded: boolean, isMoving: boolean) {
    this.targetPosition.set(transform.position.x, transform.position.y, transform.position.z);
    this.targetRotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w);
    this.isGrounded = isGrounded;
    this.isMoving = isMoving;
  }

  public update(dt: number) {
    // Smooth interpolation (lerp position, slerp quaternion)
    this.position.lerp(this.targetPosition, 1 - Math.exp(-18 * dt));
    this.model.group.position.copy(this.position);
    this.model.group.quaternion.slerp(this.targetRotation, 1 - Math.exp(-18 * dt));

    this.model.animate(performance.now() * 0.001, this.isMoving, this.isGrounded, dt);
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
}
