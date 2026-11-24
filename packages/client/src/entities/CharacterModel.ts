import * as THREE from 'three';
import { CharacterType } from '@together-apart/shared';
import { assetManager } from '../assets/AssetManager';

export type CharacterAction = 'idle' | 'walk' | 'run' | 'jump_ascend' | 'jump_fall' | 'land' | 'ability' | 'highfive' | 'celebrate' | 'wave' | 'hug' | 'dance' | 'respawn';

export class CharacterModel {
  public group: THREE.Group;
  public characterType: CharacterType;

  // Skinned GLB model & Animation Mixer
  public glbModel: THREE.Group | null = null;
  public mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentClipName: string = '';
  public proceduralRoot: THREE.Group;

  // Root animated transforms (procedural fallback)
  public rootBone: THREE.Group;
  public hips: THREE.Group;
  public torso: THREE.Group;
  public chest: THREE.Group;
  public head: THREE.Group;

  // Limbs
  public leftUpperLeg: THREE.Group;
  public leftLowerLeg: THREE.Group;
  public leftFoot: THREE.Group;
  public rightUpperLeg: THREE.Group;
  public rightLowerLeg: THREE.Group;
  public rightFoot: THREE.Group;

  public leftUpperArm: THREE.Group;
  public leftLowerArm: THREE.Group;
  public leftHand: THREE.Group;
  public rightUpperArm: THREE.Group;
  public rightLowerArm: THREE.Group;
  public rightHand: THREE.Group;

  // Facial features & blinking
  private leftEye!: THREE.Mesh;
  private rightEye!: THREE.Mesh;
  private leftEyelid!: THREE.Mesh;
  private rightEyelid!: THREE.Mesh;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;

  // Secondary animation nodes
  private wingLeftUpper!: THREE.Mesh;
  private wingLeftLower!: THREE.Mesh;
  private wingRightUpper!: THREE.Mesh;
  private wingRightLower!: THREE.Mesh;
  private scarfBones: THREE.Group[] = [];
  private hairTufts: THREE.Group[] = [];
  private orbitingOrbs: THREE.Group[] = [];

  // Animation blending state
  public currentAction: CharacterAction = 'idle';
  private squashStretch: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  private landingTimer: number = 0;
  private abilityTimer: number = 0;
  private highfiveTimer: number = 0;
  private celebrateTimer: number = 0;
  private waveTimer: number = 0;
  private hugTimer: number = 0;
  private danceTimer: number = 0;
  private respawnTimer: number = 0;

  constructor(type: CharacterType) {
    this.characterType = type;
    this.group = new THREE.Group();
    this.proceduralRoot = new THREE.Group();
    this.group.add(this.proceduralRoot);

    // Build hierarchy for procedural fallback
    this.rootBone = new THREE.Group();
    this.hips = new THREE.Group();
    this.torso = new THREE.Group();
    this.chest = new THREE.Group();
    this.head = new THREE.Group();

    this.leftUpperLeg = new THREE.Group();
    this.leftLowerLeg = new THREE.Group();
    this.leftFoot = new THREE.Group();
    this.rightUpperLeg = new THREE.Group();
    this.rightLowerLeg = new THREE.Group();
    this.rightFoot = new THREE.Group();

    this.leftUpperArm = new THREE.Group();
    this.leftLowerArm = new THREE.Group();
    this.leftHand = new THREE.Group();
    this.rightUpperArm = new THREE.Group();
    this.rightLowerArm = new THREE.Group();
    this.rightHand = new THREE.Group();

    this.assembleRig();
    if (type === 'lumi') {
      this.buildLumiVisuals();
    } else {
      this.buildNovaVisuals();
    }

    // Load professional skinned GLB model asynchronously
    this.loadGlbModel();
  }

  private async loadGlbModel() {
    try {
      const url = `/assets/characters/${this.characterType}/${this.characterType}.glb`;
      const instance = await assetManager.instantiateModel(url, 'character');
      if (!instance.isFallback && instance.root) {
        this.glbModel = instance.root;
        this.glbModel.position.set(0, 0, 0);
        this.group.add(this.glbModel);
        // Hide procedural fallback since professional GLB is active
        this.proceduralRoot.visible = false;

        this.mixer = new THREE.AnimationMixer(this.glbModel);
        for (const clip of instance.animations) {
          const action = this.mixer.clipAction(clip);
          this.actions.set(clip.name, action);
        }

        const idleAction = this.actions.get('Idle');
        if (idleAction) {
          idleAction.play();
          this.currentClipName = 'Idle';
        }
      }
    } catch (err) {
      console.warn(`[CharacterModel] Failed to load GLB for ${this.characterType}, remaining on procedural mesh.`, err);
    }
  }

  private playAction(name: string, fadeDuration: number = 0.2) {
    if (!this.mixer || this.currentClipName === name) return;
    const nextAction = this.actions.get(name);
    const prevAction = this.actions.get(this.currentClipName);
    if (nextAction) {
      if (prevAction) {
        prevAction.crossFadeTo(nextAction, fadeDuration, true);
      }
      nextAction.reset().play();
      this.currentClipName = name;
    }
  }

  private assembleRig() {
    this.proceduralRoot.add(this.rootBone);
    this.rootBone.position.y = 0.55;

    this.rootBone.add(this.hips);
    this.hips.add(this.torso);
    this.torso.position.y = 0.22;

    this.torso.add(this.chest);
    this.chest.position.y = 0.24;

    this.chest.add(this.head);
    this.head.position.y = 0.32;

    // Legs from hips
    this.hips.add(this.leftUpperLeg);
    this.leftUpperLeg.position.set(-0.16, -0.05, 0);
    this.leftUpperLeg.add(this.leftLowerLeg);
    this.leftLowerLeg.position.y = -0.22;
    this.leftLowerLeg.add(this.leftFoot);
    this.leftFoot.position.set(0, -0.20, 0.06);

    this.hips.add(this.rightUpperLeg);
    this.rightUpperLeg.position.set(0.16, -0.05, 0);
    this.rightUpperLeg.add(this.rightLowerLeg);
    this.rightLowerLeg.position.y = -0.22;
    this.rightLowerLeg.add(this.rightFoot);
    this.rightFoot.position.set(0, -0.20, 0.06);

    // Arms from chest
    this.chest.add(this.leftUpperArm);
    this.leftUpperArm.position.set(-0.28, 0.12, 0);
    this.leftUpperArm.add(this.leftLowerArm);
    this.leftLowerArm.position.y = -0.18;
    this.leftLowerArm.add(this.leftHand);
    this.leftHand.position.y = -0.16;

    this.chest.add(this.rightUpperArm);
    this.rightUpperArm.position.set(0.28, 0.12, 0);
    this.rightUpperArm.add(this.rightLowerArm);
    this.rightLowerArm.position.y = -0.18;
    this.rightLowerArm.add(this.rightHand);
    this.rightHand.position.y = -0.16;
  }

  // ==========================================
  // LUMI — THE LIGHT WEAVER (CONCEPT MATCHED)
  // ==========================================
  private buildLumiVisuals() {
    // Palette
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfd0, roughness: 0.65 });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff9aa2, transparent: true, opacity: 0.45 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xf39a9d, roughness: 0.55 });
    const dressCreamMat = new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.6 });
    const dressCoralMat = new THREE.MeshStandardMaterial({ color: 0xf28b9d, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf3cd82, metalness: 0.6, roughness: 0.3 });
    const gemRubyMat = new THREE.MeshStandardMaterial({ color: 0xef476f, emissive: 0xef476f, emissiveIntensity: 0.6 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.7 });
    const tightsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

    // 1. Head & Expressive Anime Eyes
    const headGeom = new THREE.SphereGeometry(0.32, 24, 20);
    headGeom.scale(1.0, 1.05, 0.95);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Blushing cheeks
    const cheekGeom = new THREE.CircleGeometry(0.06, 12);
    const leftCheek = new THREE.Mesh(cheekGeom, blushMat);
    leftCheek.position.set(-0.16, -0.04, 0.28);
    leftCheek.rotation.y = -0.2;
    this.head.add(leftCheek);
    const rightCheek = new THREE.Mesh(cheekGeom, blushMat);
    rightCheek.position.set(0.16, -0.04, 0.28);
    rightCheek.rotation.y = 0.2;
    this.head.add(rightCheek);

    // Eyes
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x4a2818 });
    const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeSocketGeom = new THREE.PlaneGeometry(0.11, 0.13);

    // Left Eye
    const leftEyeWhite = new THREE.Mesh(eyeSocketGeom, eyeWhiteMat);
    leftEyeWhite.position.set(-0.11, 0.05, 0.29);
    leftEyeWhite.rotation.y = -0.15;
    this.head.add(leftEyeWhite);
    this.leftEye = leftEyeWhite;

    const leftIris = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), irisMat);
    leftIris.position.set(0, -0.01, 0.005);
    leftEyeWhite.add(leftIris);
    const leftGlint = new THREE.Mesh(new THREE.CircleGeometry(0.016, 8), eyeGlintMat);
    leftGlint.position.set(-0.015, 0.02, 0.01);
    leftEyeWhite.add(leftGlint);

    // Right Eye
    const rightEyeWhite = new THREE.Mesh(eyeSocketGeom, eyeWhiteMat);
    rightEyeWhite.position.set(0.11, 0.05, 0.29);
    rightEyeWhite.rotation.y = 0.15;
    this.head.add(rightEyeWhite);
    this.rightEye = rightEyeWhite;

    const rightIris = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), irisMat);
    rightIris.position.set(0, -0.01, 0.005);
    rightEyeWhite.add(rightIris);
    const rightGlint = new THREE.Mesh(new THREE.CircleGeometry(0.016, 8), eyeGlintMat);
    rightGlint.position.set(-0.015, 0.02, 0.01);
    rightEyeWhite.add(rightGlint);

    // Eyelids for blinking
    const eyelidGeom = new THREE.PlaneGeometry(0.12, 0.14);
    this.leftEyelid = new THREE.Mesh(eyelidGeom, skinMat);
    this.leftEyelid.position.set(-0.11, 0.13, 0.295);
    this.leftEyelid.rotation.y = -0.15;
    this.leftEyelid.scale.y = 0.001; // Open
    this.head.add(this.leftEyelid);

    this.rightEyelid = new THREE.Mesh(eyelidGeom, skinMat);
    this.rightEyelid.position.set(0.11, 0.13, 0.295);
    this.rightEyelid.rotation.y = 0.15;
    this.rightEyelid.scale.y = 0.001; // Open
    this.head.add(this.rightEyelid);

    // 2. Styled Hair (Soft bangs + voluminous curls + twin side tails)
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), hairMat);
    hairCap.position.set(0, 0.04, -0.02);
    this.head.add(hairCap);

    // Front soft bangs
    const bangGeom = new THREE.ConeGeometry(0.09, 0.22, 6);
    for (let i = -2; i <= 2; i++) {
      const bang = new THREE.Mesh(bangGeom, hairMat);
      bang.position.set(i * 0.07, 0.20, 0.27);
      bang.rotation.z = i * -0.15;
      bang.rotation.x = 0.3;
      this.head.add(bang);
    }

    // Side ponytail curls with bouncing bones
    const sideHairL = new THREE.Group();
    sideHairL.position.set(-0.28, 0.10, 0.0);
    this.head.add(sideHairL);
    this.hairTufts.push(sideHairL);
    const curlL1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.25, 6, 8), hairMat);
    curlL1.position.y = -0.15;
    curlL1.rotation.z = 0.2;
    sideHairL.add(curlL1);

    const sideHairR = new THREE.Group();
    sideHairR.position.set(0.28, 0.10, 0.0);
    this.head.add(sideHairR);
    this.hairTufts.push(sideHairR);
    const curlR1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.25, 6, 8), hairMat);
    curlR1.position.y = -0.15;
    curlR1.rotation.z = -0.2;
    sideHairR.add(curlR1);

    // Back Ponytail
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), hairMat);
    backHair.position.set(0, 0.12, -0.32);
    this.head.add(backHair);

    // 3. Torso, Dress & Scalloped Skirt
    const bodiceGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.24, 12);
    const bodice = new THREE.Mesh(bodiceGeom, dressCreamMat);
    bodice.castShadow = true;
    this.torso.add(bodice);

    // Brooch jewel at collar
    const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), gemRubyMat);
    brooch.position.set(0, 0.08, 0.21);
    this.torso.add(brooch);

    // Scalloped multi-layered fairy skirt
    const skirtGeom = new THREE.ConeGeometry(0.38, 0.32, 16, 1, true);
    const skirt = new THREE.Mesh(skirtGeom, dressCoralMat);
    skirt.position.set(0, -0.06, 0);
    skirt.castShadow = true;
    this.hips.add(skirt);

    const skirtRuffle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 8, 16), dressCreamMat);
    skirtRuffle.rotation.x = Math.PI / 2;
    skirtRuffle.position.y = -0.18;
    this.hips.add(skirtRuffle);

    // 4. Limbs (White tights + small brown boots with golden buckles)
    const legGeom = new THREE.CylinderGeometry(0.065, 0.06, 0.22, 8);
    const leftLegMesh = new THREE.Mesh(legGeom, tightsMat);
    leftLegMesh.position.y = -0.11;
    this.leftUpperLeg.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(legGeom, tightsMat);
    rightLegMesh.position.y = -0.11;
    this.rightUpperLeg.add(rightLegMesh);

    const bootGeom = new THREE.CapsuleGeometry(0.075, 0.16, 6, 8);
    const leftBootMesh = new THREE.Mesh(bootGeom, bootMat);
    leftBootMesh.rotation.x = Math.PI / 2;
    leftBootMesh.castShadow = true;
    this.leftFoot.add(leftBootMesh);

    const rightBootMesh = new THREE.Mesh(bootGeom, bootMat);
    rightBootMesh.rotation.x = Math.PI / 2;
    rightBootMesh.castShadow = true;
    this.rightFoot.add(rightBootMesh);

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.05, 0.045, 0.18, 8);
    const leftArmMesh = new THREE.Mesh(armGeom, dressCreamMat);
    leftArmMesh.position.y = -0.09;
    this.leftUpperArm.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeom, dressCreamMat);
    rightArmMesh.position.y = -0.09;
    this.rightUpperArm.add(rightArmMesh);

    const handGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const leftHandMesh = new THREE.Mesh(handGeom, skinMat);
    this.leftHand.add(leftHandMesh);
    const rightHandMesh = new THREE.Mesh(handGeom, skinMat);
    this.rightHand.add(rightHandMesh);

    // 5. Translucent Glowing Butterfly Wings
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffd6e8,
      emissive: 0xff8fa3,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    });

    // Upper Left Wing
    const wingShapeU = new THREE.Shape();
    wingShapeU.moveTo(0, 0);
    wingShapeU.bezierCurveTo(-0.15, 0.2, -0.4, 0.45, -0.55, 0.35);
    wingShapeU.bezierCurveTo(-0.6, 0.15, -0.3, -0.1, 0, 0);
    const wingUGeom = new THREE.ShapeGeometry(wingShapeU);

    this.wingLeftUpper = new THREE.Mesh(wingUGeom, wingMat);
    this.wingLeftUpper.position.set(-0.06, 0.08, -0.18);
    this.wingLeftUpper.rotation.y = -0.4;
    this.chest.add(this.wingLeftUpper);

    // Lower Left Wing
    const wingShapeL = new THREE.Shape();
    wingShapeL.moveTo(0, 0);
    wingShapeL.bezierCurveTo(-0.15, -0.05, -0.35, -0.25, -0.4, -0.15);
    wingShapeL.bezierCurveTo(-0.35, 0.05, -0.1, 0.05, 0, 0);
    const wingLGeom = new THREE.ShapeGeometry(wingShapeL);

    this.wingLeftLower = new THREE.Mesh(wingLGeom, wingMat);
    this.wingLeftLower.position.set(-0.06, 0.02, -0.18);
    this.wingLeftLower.rotation.y = -0.4;
    this.chest.add(this.wingLeftLower);

    // Upper Right Wing
    this.wingRightUpper = new THREE.Mesh(wingUGeom, wingMat);
    this.wingRightUpper.position.set(0.06, 0.08, -0.18);
    this.wingRightUpper.scale.x = -1.0;
    this.wingRightUpper.rotation.y = 0.4;
    this.chest.add(this.wingRightUpper);

    // Lower Right Wing
    this.wingRightLower = new THREE.Mesh(wingLGeom, wingMat);
    this.wingRightLower.position.set(0.06, 0.02, -0.18);
    this.wingRightLower.scale.x = -1.0;
    this.wingRightLower.rotation.y = 0.4;
    this.chest.add(this.wingRightLower);

    // 6. Flowing Scarf with Wave Simulation
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, roughness: 0.5, side: THREE.DoubleSide });
    const collarScarf = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), scarfMat);
    collarScarf.rotation.x = Math.PI / 2;
    collarScarf.position.set(0, 0.22, 0);
    this.chest.add(collarScarf);

    // Scarf tail segments
    let parentBone: THREE.Group = this.chest;
    for (let s = 0; s < 4; s++) {
      const tailBone = new THREE.Group();
      tailBone.position.set(0.08, s === 0 ? 0.16 : -0.14, s === 0 ? -0.16 : -0.08);
      parentBone.add(tailBone);
      this.scarfBones.push(tailBone);

      const tailMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), scarfMat);
      tailMesh.position.y = -0.08;
      tailBone.add(tailMesh);
      parentBone = tailBone;
    }
  }

  // ==========================================
  // NOVA — THE KINETIC SHAPER (CONCEPT MATCHED)
  // ==========================================
  private buildNovaVisuals() {
    // Palette
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xa87550, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x22b2bd, roughness: 0.5 });
    const tunicTealMat = new THREE.MeshStandardMaterial({ color: 0x1d9da8, roughness: 0.55 });
    const tunicGoldTrim = new THREE.MeshStandardMaterial({ color: 0xf3cd82, metalness: 0.5, roughness: 0.3 });
    const gauntletMat = new THREE.MeshStandardMaterial({ color: 0x3d2b20, roughness: 0.65 });
    const cyanEnergyMat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.8 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x261b14, roughness: 0.8 });
    const trousersMat = new THREE.MeshStandardMaterial({ color: 0x2a363f, roughness: 0.7 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3d281a, roughness: 0.7 });

    // 1. Head & Elven Ears
    const headGeom = new THREE.SphereGeometry(0.32, 24, 20);
    headGeom.scale(1.0, 1.05, 0.95);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Cute Pointed Elven Ears
    const earGeom = new THREE.ConeGeometry(0.08, 0.22, 6);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(-0.32, 0.05, -0.05);
    leftEar.rotation.z = 1.1;
    leftEar.rotation.y = -0.3;
    this.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(0.32, 0.05, -0.05);
    rightEar.rotation.z = -1.1;
    rightEar.rotation.y = 0.3;
    this.head.add(rightEar);

    // Eyes with Alert Pupils & Cyan Specular Glint
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x2e1a12 });
    const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const eyeSocketGeom = new THREE.PlaneGeometry(0.11, 0.13);

    // Left Eye
    const leftEyeWhite = new THREE.Mesh(eyeSocketGeom, eyeWhiteMat);
    leftEyeWhite.position.set(-0.11, 0.05, 0.29);
    leftEyeWhite.rotation.y = -0.15;
    this.head.add(leftEyeWhite);
    this.leftEye = leftEyeWhite;

    const leftIris = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), irisMat);
    leftIris.position.set(0, -0.01, 0.005);
    leftEyeWhite.add(leftIris);
    const leftGlint = new THREE.Mesh(new THREE.CircleGeometry(0.016, 8), eyeGlintMat);
    leftGlint.position.set(-0.015, 0.02, 0.01);
    leftEyeWhite.add(leftGlint);

    // Right Eye
    const rightEyeWhite = new THREE.Mesh(eyeSocketGeom, eyeWhiteMat);
    rightEyeWhite.position.set(0.11, 0.05, 0.29);
    rightEyeWhite.rotation.y = 0.15;
    this.head.add(rightEyeWhite);
    this.rightEye = rightEyeWhite;

    const rightIris = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), irisMat);
    rightIris.position.set(0, -0.01, 0.005);
    rightEyeWhite.add(rightIris);
    const rightGlint = new THREE.Mesh(new THREE.CircleGeometry(0.016, 8), eyeGlintMat);
    rightGlint.position.set(-0.015, 0.02, 0.01);
    rightEyeWhite.add(rightGlint);

    // Eyelids
    const eyelidGeom = new THREE.PlaneGeometry(0.12, 0.14);
    this.leftEyelid = new THREE.Mesh(eyelidGeom, skinMat);
    this.leftEyelid.position.set(-0.11, 0.13, 0.295);
    this.leftEyelid.rotation.y = -0.15;
    this.leftEyelid.scale.y = 0.001;
    this.head.add(this.leftEyelid);

    this.rightEyelid = new THREE.Mesh(eyelidGeom, skinMat);
    this.rightEyelid.position.set(0.11, 0.13, 0.295);
    this.rightEyelid.rotation.y = 0.15;
    this.rightEyelid.scale.y = 0.001;
    this.head.add(this.rightEyelid);

    // 2. Swept Turquoise Hair & Winged Golden Helm
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 16), hairMat);
    hairCap.position.set(0, 0.05, -0.02);
    this.head.add(hairCap);

    // Dynamic sweeping crest hair tuft
    const hairCrest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 8), hairMat);
    hairCrest.position.set(0, 0.35, 0.08);
    hairCrest.rotation.x = -0.55;
    this.head.add(hairCrest);

    // Golden Winged Headpiece / Circlet
    const circlet = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 20), tunicGoldTrim);
    circlet.position.set(0, 0.14, 0);
    circlet.rotation.x = Math.PI / 2;
    this.head.add(circlet);

    // Central Forehead Power Gem
    const headGem = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), cyanEnergyMat);
    headGem.position.set(0, 0.14, 0.34);
    this.head.add(headGem);

    // Golden Flaring Wing Crests on sides
    const wingCrestGeom = new THREE.ConeGeometry(0.08, 0.28, 6);
    const leftWingCrest = new THREE.Mesh(wingCrestGeom, tunicGoldTrim);
    leftWingCrest.position.set(-0.35, 0.22, 0.02);
    leftWingCrest.rotation.z = 0.7;
    leftWingCrest.rotation.x = -0.2;
    this.head.add(leftWingCrest);

    const rightWingCrest = new THREE.Mesh(wingCrestGeom, tunicGoldTrim);
    rightWingCrest.position.set(0.35, 0.22, 0.02);
    rightWingCrest.rotation.z = -0.7;
    rightWingCrest.rotation.x = -0.2;
    this.head.add(rightWingCrest);

    // 3. Torso, Teal Adventurer Tunic & Brass Belt
    const tunicGeom = new THREE.CylinderGeometry(0.19, 0.24, 0.26, 12);
    const tunic = new THREE.Mesh(tunicGeom, tunicTealMat);
    tunic.castShadow = true;
    this.torso.add(tunic);

    // Leather belt with large circular brass buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 16), beltMat);
    belt.position.y = -0.06;
    this.hips.add(belt);

    const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16), tunicGoldTrim);
    buckle.rotation.x = Math.PI / 2;
    buckle.position.set(0, -0.06, 0.25);
    this.hips.add(buckle);

    // 4. Limbs, Slate Trousers, Cuff Boots
    const legGeom = new THREE.CylinderGeometry(0.07, 0.065, 0.22, 8);
    const leftLegMesh = new THREE.Mesh(legGeom, trousersMat);
    leftLegMesh.position.y = -0.11;
    this.leftUpperLeg.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(legGeom, trousersMat);
    rightLegMesh.position.y = -0.11;
    this.rightUpperLeg.add(rightLegMesh);

    const bootGeom = new THREE.CapsuleGeometry(0.08, 0.18, 6, 8);
    const leftBootMesh = new THREE.Mesh(bootGeom, bootMat);
    leftBootMesh.rotation.x = Math.PI / 2;
    leftBootMesh.castShadow = true;
    this.leftFoot.add(leftBootMesh);

    const rightBootMesh = new THREE.Mesh(bootGeom, bootMat);
    rightBootMesh.rotation.x = Math.PI / 2;
    rightBootMesh.castShadow = true;
    this.rightFoot.add(rightBootMesh);

    // 5. Oversized Magical Kinetic Gauntlets
    const armGeom = new THREE.CylinderGeometry(0.055, 0.05, 0.16, 8);
    const leftArmMesh = new THREE.Mesh(armGeom, tunicTealMat);
    leftArmMesh.position.y = -0.08;
    this.leftUpperArm.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeom, tunicTealMat);
    rightArmMesh.position.y = -0.08;
    this.rightUpperArm.add(rightArmMesh);

    // Chunky gauntlets on hands
    const gauntletGeom = new THREE.BoxGeometry(0.16, 0.18, 0.16);
    const leftGauntlet = new THREE.Mesh(gauntletGeom, gauntletMat);
    leftGauntlet.position.y = -0.08;
    leftGauntlet.castShadow = true;
    this.leftHand.add(leftGauntlet);

    const leftVent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.17), cyanEnergyMat);
    leftGauntlet.add(leftVent);

    const rightGauntlet = new THREE.Mesh(gauntletGeom, gauntletMat);
    rightGauntlet.position.y = -0.08;
    rightGauntlet.castShadow = true;
    this.rightHand.add(rightGauntlet);

    const rightVent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.17), cyanEnergyMat);
    rightGauntlet.add(rightVent);

    // 6. Orbiting Kinetic Relic Orbs
    for (let o = 0; o < 2; o++) {
      const orbPivot = new THREE.Group();
      this.torso.add(orbPivot);
      this.orbitingOrbs.push(orbPivot);

      const orbMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), cyanEnergyMat);
      orbMesh.position.set(o === 0 ? 0.48 : -0.48, 0.05, 0);
      orbPivot.add(orbMesh);

      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 6, 16), tunicGoldTrim);
      ringMesh.position.copy(orbMesh.position);
      ringMesh.rotation.x = Math.PI / 3;
      orbPivot.add(ringMesh);
    }
  }

  // ==========================================
  // UNIVERSAL ANIMATION STATE MACHINE
  // ==========================================
  public animate(
    time: number,
    isMoving: boolean,
    isGrounded: boolean,
    dt: number,
    speedRatio: number = 0, // 0 = idle, 1 = walk, 1.5 = sprint
    turnRate: number = 0    // Angular velocity for banking
  ) {
    // 1. Emote & Action Timers
    if (this.landingTimer > 0) this.landingTimer -= dt;
    if (this.celebrateTimer > 0) this.celebrateTimer -= dt;
    if (this.highfiveTimer > 0) this.highfiveTimer -= dt;
    if (this.abilityTimer > 0) this.abilityTimer -= dt;
    if (this.waveTimer > 0) this.waveTimer -= dt;
    if (this.hugTimer > 0) this.hugTimer -= dt;
    if (this.danceTimer > 0) this.danceTimer -= dt;
    if (this.respawnTimer > 0) this.respawnTimer -= dt;

    // If professional Skinned GLB model & Mixer is active
    if (this.mixer) {
      let targetAnim = 'Idle';
      if (this.celebrateTimer > 0) {
        targetAnim = 'Celebrate';
      } else if (this.highfiveTimer > 0) {
        targetAnim = 'HighFive';
      } else if (this.waveTimer > 0) {
        targetAnim = 'Wave';
      } else if (this.hugTimer > 0) {
        targetAnim = 'Hug';
      } else if (this.danceTimer > 0) {
        targetAnim = 'Dance';
      } else if (this.respawnTimer > 0) {
        targetAnim = 'Respawn';
      } else if (this.abilityTimer > 0) {
        targetAnim = 'Ability';
      } else if (this.landingTimer > 0) {
        targetAnim = 'Land';
      } else if (!isGrounded) {
        targetAnim = 'JumpLoop';
      } else if (isMoving) {
        targetAnim = (speedRatio > 1.1) ? 'Run' : 'Walk';
      }

      this.currentAction = targetAnim.toLowerCase() as CharacterAction;
      this.playAction(targetAnim);
      this.mixer.update(dt);

      if (this.glbModel) {
        // Lean into turns
        this.glbModel.rotation.z = THREE.MathUtils.lerp(this.glbModel.rotation.z, -turnRate * 0.12, dt * 10);
        // Landing squash
        if (this.landingTimer > 0) {
          const t = this.landingTimer / 0.22;
          const squash = 1.0 - Math.sin(t * Math.PI) * 0.15;
          const stretch = 1.0 + Math.sin(t * Math.PI) * 0.10;
          this.glbModel.scale.set(stretch, squash, stretch);
        } else {
          this.glbModel.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 12);
        }
      }
      return;
    }

    // 2. Fallback Procedural Eye Blinking (Every 3.8 - 4.5 seconds)
    this.blinkTimer += dt;
    if (!this.isBlinking && this.blinkTimer > 3.8 + Math.sin(time) * 0.7) {
      this.isBlinking = true;
    }
    if (this.isBlinking) {
      const blinkProgress = (this.blinkTimer - 4.0) * 12; // Fast blink
      if (blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.leftEyelid.scale.y = 0.001;
        this.rightEyelid.scale.y = 0.001;
      } else {
        const eyeScale = Math.sin(blinkProgress * Math.PI);
        this.leftEyelid.scale.y = Math.max(0.001, eyeScale);
        this.rightEyelid.scale.y = Math.max(0.001, eyeScale);
      }
    }

    // 2. Landing Squash & Stretch recovery
    if (this.landingTimer > 0) {
      this.landingTimer -= dt;
      const t = this.landingTimer / 0.22;
      const squash = 1.0 - Math.sin(t * Math.PI) * 0.18;
      const stretch = 1.0 + Math.sin(t * Math.PI) * 0.12;
      this.rootBone.scale.set(stretch, squash, stretch);
    } else {
      this.rootBone.scale.set(1, 1, 1);
    }

    // 3. Action State Switching
    if (this.celebrateTimer > 0) {
      this.celebrateTimer -= dt;
      this.animateCelebrate(time, dt);
    } else if (this.highfiveTimer > 0) {
      this.highfiveTimer -= dt;
      this.animateHighFive(time, dt);
    } else if (this.abilityTimer > 0) {
      this.abilityTimer -= dt;
      this.animateAbility(time, dt);
    } else if (!isGrounded) {
      this.animateAirborne(time, dt);
    } else if (isMoving) {
      const isSprinting = speedRatio > 1.1;
      this.animateLocomotion(time, dt, isSprinting, turnRate);
    } else {
      this.animateIdle(time, dt);
    }

    // 4. Secondary Physics: Wings, Scarf, Hair & Orbiting Accessories
    this.updateSecondaryPhysics(time, dt, isMoving);
  }

  private animateIdle(time: number, dt: number) {
    this.currentAction = 'idle';
    const breath = Math.sin(time * 2.2);

    // Torso breathing
    this.hips.position.y = THREE.MathUtils.lerp(this.hips.position.y, breath * 0.015, dt * 8);
    this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, breath * 0.02, dt * 8);
    this.chest.rotation.x = THREE.MathUtils.lerp(this.chest.rotation.x, -breath * 0.015, dt * 8);
    this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, Math.sin(time * 1.5) * 0.03, dt * 6);
    this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, Math.cos(time * 1.1) * 0.02, dt * 6);

    // Relaxed limbs
    this.leftUpperLeg.rotation.x = THREE.MathUtils.lerp(this.leftUpperLeg.rotation.x, 0, dt * 10);
    this.rightUpperLeg.rotation.x = THREE.MathUtils.lerp(this.rightUpperLeg.rotation.x, 0, dt * 10);
    this.leftUpperArm.rotation.x = THREE.MathUtils.lerp(this.leftUpperArm.rotation.x, 0.05 + breath * 0.04, dt * 8);
    this.rightUpperArm.rotation.x = THREE.MathUtils.lerp(this.rightUpperArm.rotation.x, 0.05 + breath * 0.04, dt * 8);
    this.leftUpperArm.rotation.z = THREE.MathUtils.lerp(this.leftUpperArm.rotation.z, 0.12, dt * 8);
    this.rightUpperArm.rotation.z = THREE.MathUtils.lerp(this.rightUpperArm.rotation.z, -0.12, dt * 8);
    this.rootBone.rotation.z = THREE.MathUtils.lerp(this.rootBone.rotation.z, 0, dt * 10);
  }

  private animateLocomotion(time: number, dt: number, isSprinting: boolean, turnRate: number) {
    this.currentAction = isSprinting ? 'run' : 'walk';
    const freq = isSprinting ? 14.5 : 10.5;
    const stride = isSprinting ? 0.85 : 0.65;
    const cycle = time * freq;

    // Hip bob & forward lean
    const bob = Math.abs(Math.sin(cycle)) * (isSprinting ? 0.06 : 0.035);
    this.hips.position.y = THREE.MathUtils.lerp(this.hips.position.y, bob, dt * 12);
    this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, isSprinting ? 0.22 : 0.09, dt * 10);

    // Banking into turns
    const targetBank = THREE.MathUtils.clamp(turnRate * -0.25, -0.28, 0.28);
    this.rootBone.rotation.z = THREE.MathUtils.lerp(this.rootBone.rotation.z, targetBank, dt * 10);

    // Legs swing
    const legL = Math.sin(cycle) * stride;
    const legR = -legL;
    this.leftUpperLeg.rotation.x = legL;
    this.rightUpperLeg.rotation.x = legR;
    this.leftLowerLeg.rotation.x = legL > 0 ? Math.max(0, Math.sin(cycle + 0.3) * 0.6) : 0.1;
    this.rightLowerLeg.rotation.x = legR > 0 ? Math.max(0, -Math.sin(cycle + 0.3) * 0.6) : 0.1;

    // Counter arm swings
    const armL = -legL * 0.9;
    const armR = -legR * 0.9;
    this.leftUpperArm.rotation.x = armL;
    this.rightUpperArm.rotation.x = armR;
    this.leftLowerArm.rotation.x = isSprinting ? -0.4 : -0.2;
    this.rightLowerArm.rotation.x = isSprinting ? -0.4 : -0.2;

    // Head stabilization
    this.head.rotation.x = -this.torso.rotation.x * 0.6;
    this.head.rotation.y = Math.sin(cycle * 0.5) * 0.06;
  }

  private animateAirborne(time: number, dt: number) {
    this.currentAction = 'jump_ascend';

    // Arms outstretched, legs tucked gracefully
    this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, -0.1, dt * 8);
    this.leftUpperLeg.rotation.x = THREE.MathUtils.lerp(this.leftUpperLeg.rotation.x, -0.45, dt * 10);
    this.rightUpperLeg.rotation.x = THREE.MathUtils.lerp(this.rightUpperLeg.rotation.x, 0.25, dt * 10);
    this.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(this.leftLowerLeg.rotation.x, 0.6, dt * 10);
    this.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(this.rightLowerLeg.rotation.x, 0.4, dt * 10);

    this.leftUpperArm.rotation.x = THREE.MathUtils.lerp(this.leftUpperArm.rotation.x, -1.2, dt * 10);
    this.rightUpperArm.rotation.x = THREE.MathUtils.lerp(this.rightUpperArm.rotation.x, -1.2, dt * 10);
    this.leftUpperArm.rotation.z = THREE.MathUtils.lerp(this.leftUpperArm.rotation.z, 0.5, dt * 10);
    this.rightUpperArm.rotation.z = THREE.MathUtils.lerp(this.rightUpperArm.rotation.z, -0.5, dt * 10);
  }

  private animateAbility(time: number, dt: number) {
    this.currentAction = 'ability';
    if (this.characterType === 'lumi') {
      // Cast pose: right arm high, spin gesture
      this.rightUpperArm.rotation.x = -2.1;
      this.rightUpperArm.rotation.z = -0.4;
      this.leftUpperArm.rotation.x = 0.5;
      this.torso.rotation.y = Math.sin(time * 12) * 0.2;
    } else {
      // Nova kinetic punch pose: right gauntlet driven forward
      this.rightUpperArm.rotation.x = -1.5;
      this.rightLowerArm.rotation.x = 0;
      this.leftUpperArm.rotation.x = 0.8;
      this.torso.rotation.x = 0.35;
    }
  }

  private animateHighFive(time: number, dt: number) {
    this.currentAction = 'highfive';
    // Raise right arm high with welcoming tilt
    this.rightUpperArm.rotation.x = THREE.MathUtils.lerp(this.rightUpperArm.rotation.x, -2.4, dt * 14);
    this.rightUpperArm.rotation.z = THREE.MathUtils.lerp(this.rightUpperArm.rotation.z, -0.3, dt * 14);
    this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, -0.2, dt * 10);
  }

  private animateCelebrate(time: number, dt: number) {
    this.currentAction = 'celebrate';
    const bounce = Math.sin(time * 12);
    this.hips.position.y = Math.abs(bounce) * 0.15;
    this.leftUpperArm.rotation.x = -2.3 + bounce * 0.2;
    this.rightUpperArm.rotation.x = -2.3 - bounce * 0.2;
    this.head.rotation.x = -0.2;
  }

  private updateSecondaryPhysics(time: number, dt: number, isMoving: boolean) {
    if (this.characterType === 'lumi') {
      // Wings harmonic fluttering (flutter rate scales with movement)
      const flutterFreq = isMoving ? 28.0 : 12.0;
      const wingAmp = isMoving ? 0.45 : 0.22;
      const flutter = Math.sin(time * flutterFreq) * wingAmp;

      if (this.wingLeftUpper) {
        this.wingLeftUpper.rotation.y = -0.35 + flutter;
        this.wingLeftLower.rotation.y = -0.35 + flutter * 0.8;
        this.wingRightUpper.rotation.y = 0.35 - flutter;
        this.wingRightLower.rotation.y = 0.35 - flutter * 0.8;
      }

      // Scarf trailing physics simulation
      this.scarfBones.forEach((bone, idx) => {
        const wave = Math.sin(time * 8.0 - idx * 0.8) * 0.2;
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, 0.4 + wave, dt * 12);
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, Math.cos(time * 6.0) * 0.1, dt * 12);
      });

      // Hair bounce
      this.hairTufts.forEach((hair, idx) => {
        hair.rotation.z = (idx === 0 ? 0.2 : -0.2) + Math.sin(time * 5.0) * 0.08;
      });
    } else {
      // Nova orbiting satellites
      this.orbitingOrbs.forEach((pivot, idx) => {
        const speed = this.abilityTimer > 0 ? 12.0 : 3.5;
        pivot.rotation.y += dt * (idx === 0 ? speed : -speed);
      });
    }
  }

  public triggerLandingSquash() {
    this.landingTimer = 0.22;
  }

  public triggerAbility() {
    this.abilityTimer = 0.45;
  }

  public triggerHighFive() {
    this.highfiveTimer = 0.85;
  }

  public triggerWave() {
    this.waveTimer = 1.2;
  }

  public triggerHug() {
    this.hugTimer = 1.5;
  }

  public triggerDance() {
    this.danceTimer = 2.0;
  }

  public triggerRespawn() {
    this.respawnTimer = 1.4;
  }

  public celebrate() {
    this.celebrateTimer = 3.5;
  }
}
