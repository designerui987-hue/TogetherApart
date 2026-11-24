import * as THREE from 'three';
import { CharacterType } from '@together-apart/shared';

export class CharacterModel {
  public group: THREE.Group;
  public characterType: CharacterType;
  
  // Animation nodes
  private bodyMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private leftEye!: THREE.Mesh;
  private rightEye!: THREE.Mesh;
  private accessoryGroup: THREE.Group = new THREE.Group();

  constructor(type: CharacterType) {
    this.characterType = type;
    this.group = new THREE.Group();
    this.buildProceduralModel();
  }

  private buildProceduralModel() {
    const isLumi = this.characterType === 'lumi';

    // Base materials
    const mainColor = isLumi ? 0xff758c : 0x00b4d8;
    const accentColor = isLumi ? 0xffb7b2 : 0x90e0ef;
    const emissiveColor = isLumi ? 0xffd54f : 0x00f5d4;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.35,
      metalness: 0.1,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.4,
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
      color: emissiveColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Torso
    const bodyGeom = new THREE.CapsuleGeometry(0.3, 0.4, 8, 16);
    this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
    this.bodyMesh.position.y = 0.55;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // 2. Head
    const headGeom = new THREE.SphereGeometry(0.34, 20, 20);
    this.headMesh = new THREE.Mesh(headGeom, accentMaterial);
    this.headMesh.position.y = 0.55;
    this.headMesh.castShadow = true;
    this.bodyMesh.add(this.headMesh);

    // 3. Eyes
    const eyeGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const pupilGeom = new THREE.SphereGeometry(0.025, 8, 8);

    this.leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    this.leftEye.position.set(-0.12, 0.05, 0.28);
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMaterial);
    leftPupil.position.set(-0.015, 0.02, 0.05);
    this.leftEye.add(leftPupil);
    this.headMesh.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    this.rightEye.position.set(0.12, 0.05, 0.28);
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMaterial);
    rightPupil.position.set(0.015, 0.02, 0.05);
    this.rightEye.add(rightPupil);
    this.headMesh.add(this.rightEye);

    // 4. Limbs
    const limbGeom = new THREE.CapsuleGeometry(0.09, 0.25, 4, 8);

    // Legs
    this.leftLeg = new THREE.Mesh(limbGeom, bodyMaterial);
    this.leftLeg.position.set(-0.16, -0.35, 0);
    this.leftLeg.castShadow = true;
    this.bodyMesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(limbGeom, bodyMaterial);
    this.rightLeg.position.set(0.16, -0.35, 0);
    this.rightLeg.castShadow = true;
    this.bodyMesh.add(this.rightLeg);

    // Arms
    this.leftArm = new THREE.Mesh(limbGeom, accentMaterial);
    this.leftArm.position.set(-0.35, 0.15, 0);
    this.leftArm.castShadow = true;
    this.bodyMesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(limbGeom, accentMaterial);
    this.rightArm.position.set(0.35, 0.15, 0);
    this.rightArm.castShadow = true;
    this.bodyMesh.add(this.rightArm);

    // 5. Unique Character Accessories
    this.headMesh.add(this.accessoryGroup);
    if (isLumi) {
      // Lumi: Light antenna + Little Fluttering Fairy Wings
      const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.25);
      const stem = new THREE.Mesh(stemGeom, accentMaterial);
      stem.position.y = 0.42;
      this.accessoryGroup.add(stem);

      const starGeom = new THREE.DodecahedronGeometry(0.1, 0);
      const star = new THREE.Mesh(starGeom, glowMaterial);
      star.position.y = 0.55;
      this.accessoryGroup.add(star);

      // Wings
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(0.3, 0.4, 0.5, 0.2);
      wingShape.quadraticCurveTo(0.3, -0.2, 0, 0);
      const wingGeom = new THREE.ShapeGeometry(wingShape);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });

      const leftWing = new THREE.Mesh(wingGeom, wingMat);
      leftWing.position.set(-0.15, 0.1, -0.25);
      leftWing.rotation.y = Math.PI * 0.75;
      leftWing.scale.set(0.6, 0.6, 0.6);
      leftWing.name = 'wingL';
      this.bodyMesh.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeom, wingMat);
      rightWing.position.set(0.15, 0.1, -0.25);
      rightWing.rotation.y = Math.PI * 0.25;
      rightWing.scale.set(-0.6, 0.6, 0.6);
      rightWing.name = 'wingR';
      this.bodyMesh.add(rightWing);
    } else {
      // Nova: Magnetic floating crystal horns + orbiting satellite
      const hornGeom = new THREE.ConeGeometry(0.08, 0.35, 6);
      const leftHorn = new THREE.Mesh(hornGeom, glowMaterial);
      leftHorn.position.set(-0.35, 0.35, 0);
      leftHorn.rotation.z = -0.4;
      this.accessoryGroup.add(leftHorn);

      const rightHorn = new THREE.Mesh(hornGeom, glowMaterial);
      rightHorn.position.set(0.35, 0.35, 0);
      rightHorn.rotation.z = 0.4;
      this.accessoryGroup.add(rightHorn);

      // Orbiting magnetic pulse drone
      const droneGeom = new THREE.OctahedronGeometry(0.09, 0);
      const drone = new THREE.Mesh(droneGeom, glowMaterial);
      drone.position.set(0.5, 0.1, 0);
      drone.name = 'drone';
      this.accessoryGroup.add(drone);
    }
  }

  public animate(time: number, isMoving: boolean, isGrounded: boolean, dt: number) {
    if (this.characterType === 'lumi') {
      const wingL = this.bodyMesh.getObjectByName('wingL');
      const wingR = this.bodyMesh.getObjectByName('wingR');
      if (wingL && wingR) {
        const flutter = Math.sin(time * 18) * 0.35;
        wingL.rotation.y = Math.PI * 0.75 + flutter;
        wingR.rotation.y = Math.PI * 0.25 - flutter;
      }
    } else {
      const drone = this.accessoryGroup.getObjectByName('drone');
      if (drone) {
        drone.position.x = Math.cos(time * 3.0) * 0.55;
        drone.position.z = Math.sin(time * 3.0) * 0.55;
        drone.position.y = 0.1 + Math.sin(time * 6.0) * 0.1;
        drone.rotation.y += dt * 4;
      }
    }

    if (!isGrounded) {
      // Jump / Fall pose
      this.leftLeg.rotation.x = -0.4;
      this.rightLeg.rotation.x = 0.4;
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = -1.2;
      this.bodyMesh.position.y = 0.55 + Math.sin(time * 4) * 0.05;
      return;
    }

    if (isMoving) {
      // Walk cycle
      const walkCycle = time * 12;
      this.leftLeg.rotation.x = Math.sin(walkCycle) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
      this.leftArm.rotation.x = -Math.sin(walkCycle) * 0.65;
      this.rightArm.rotation.x = Math.sin(walkCycle) * 0.65;
      this.bodyMesh.position.y = 0.55 + Math.abs(Math.sin(walkCycle)) * 0.08;
      this.headMesh.rotation.y = Math.sin(walkCycle * 0.5) * 0.1;
    } else {
      // Idle breathing cycle
      const idleCycle = time * 2.5;
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 8);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 8);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 8);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, dt * 8);
      this.bodyMesh.position.y = 0.55 + Math.sin(idleCycle) * 0.03;
      this.headMesh.position.y = 0.55 + Math.sin(idleCycle) * 0.015;
    }
  }

  public celebrate() {
    this.leftArm.rotation.x = -2.2;
    this.rightArm.rotation.x = -2.2;
  }
}
