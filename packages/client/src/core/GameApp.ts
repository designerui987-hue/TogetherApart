import * as THREE from 'three';
import {
  ABILITIES,
  CHECKPOINTS,
  CharacterType,
  PHYSICS,
  PuzzleState,
  RoomState,
  TransformState,
  Vector3D
} from '@together-apart/shared';
import { SceneManager } from '../graphics/SceneManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { ParticleSystem } from '../graphics/ParticleSystem';
import { InputManager } from '../input/InputManager';
import { CameraController } from '../camera/CameraController';
import { PlayerController } from '../entities/PlayerController';
import { RemotePlayer } from '../entities/RemotePlayer';
import { IslandLevel } from '../level/IslandLevel';
import { NetworkClient } from '../network/NetworkClient';
import { UIManager } from '../ui/UIManager';
import { soundSynth } from '../audio/SoundSynth';

export class GameApp {
  private sceneManager!: SceneManager;
  private physicsWorld!: PhysicsWorld;
  private particles!: ParticleSystem;
  private inputManager!: InputManager;
  private cameraController!: CameraController;
  private level!: IslandLevel;
  private network!: NetworkClient;
  private ui!: UIManager;

  // Game Mode & Players
  private gameMode: 'none' | 'online' | 'local' = 'none';
  private player1: PlayerController | null = null;
  private player2: PlayerController | null = null; // Used in local mode
  private remotePlayer: RemotePlayer | null = null; // Used in online mode
  private myCharacterType: CharacterType = 'lumi';

  // State
  private currentCheckpointId: number = 0;
  private localPuzzleState: PuzzleState | null = null;
  private lastNetworkSendTime: number = 0;
  private isGameOver: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    const container = document.getElementById('game-container')!;
    this.sceneManager = new SceneManager(container);
    this.particles = new ParticleSystem();
    this.sceneManager.scene.add(this.particles.group);

    this.physicsWorld = new PhysicsWorld();
    await this.physicsWorld.init();

    this.inputManager = new InputManager();
    this.cameraController = new CameraController(this.sceneManager.camera);
    this.level = new IslandLevel(this.physicsWorld, this.particles);
    this.sceneManager.scene.add(this.level.group);

    this.network = new NetworkClient();
    this.ui = new UIManager();

    this.setupUIHandlers();
    this.setupNetworkHandlers();

    // Canvas click locks pointer
    container.addEventListener('click', () => {
      if (this.gameMode !== 'none') {
        this.inputManager.requestPointerLock(document.body);
      }
    });

    // Start render & physics loop
    this.startLoop();
  }

  private setupUIHandlers() {
    this.ui.onCreateRoom = async (name, character) => {
      this.myCharacterType = character;
      const res = await this.network.createRoom(name, character);
      if (res.success && res.room) {
        this.ui.showScreen('LOBBY');
        this.ui.updateLobby(res.room, this.network.myPlayerId);
      } else {
        alert(res.error || 'Failed to create room.');
      }
    };

    this.ui.onJoinRoom = async (code, name) => {
      const res = await this.network.joinRoom(code, name);
      if (res.success && res.room) {
        // Set character according to room assignment
        const me = res.room.players[this.network.myPlayerId];
        if (me) this.myCharacterType = me.character;
        this.ui.showScreen('LOBBY');
        this.ui.updateLobby(res.room, this.network.myPlayerId);
      } else {
        alert(res.error || 'Failed to join room.');
      }
    };

    this.ui.onSwitchCharacter = () => {
      const newChar = this.myCharacterType === 'lumi' ? 'nova' : 'lumi';
      this.myCharacterType = newChar;
      this.network.selectCharacter(newChar);
    };

    this.ui.onToggleReady = (ready) => {
      this.network.setReady(ready);
    };

    this.ui.onStartGame = () => {
      this.network.startGame();
    };

    this.ui.onLeaveLobby = () => {
      this.gameMode = 'none';
      this.cleanupPlayers();
    };

    this.ui.onLocalPlay = () => {
      this.startLocalGame();
    };

    this.ui.onReplay = () => {
      if (this.gameMode === 'local') {
        this.startLocalGame();
      } else {
        this.network.sendRespawn(0);
      }
    };

    this.ui.onQualityPresetChange = (preset) => {
      this.sceneManager.setQualityPreset(preset);
    };

    this.ui.onReducedMotionChange = (enabled) => {
      this.cameraController.reducedMotion = enabled;
    };

    this.ui.onTriggerEmote = (emote) => {
      if (this.gameMode === 'online') {
        this.network.sendEmote(emote);
        if (this.player1) this.player1.triggerEmote(emote);
      } else if (this.gameMode === 'local') {
        if (this.player1) this.player1.triggerEmote(emote);
        if (this.player2) this.player2.triggerEmote(emote);
        if (this.player1) this.particles.emitHearts(this.player1.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 8);
      }
    };
  }

  private setupNetworkHandlers() {
    this.network.onRoomUpdated = (room) => {
      const me = room.players[this.network.myPlayerId];
      if (me) this.myCharacterType = me.character;
      this.ui.updateLobby(room, this.network.myPlayerId);
    };

    this.network.onGameStarted = (room) => {
      this.startOnlineGame(room);
    };

    this.network.onStateTick = (players) => {
      if (!this.remotePlayer) return;
      for (const [id, data] of Object.entries(players)) {
        if (id !== this.network.myPlayerId && id === this.remotePlayer.id) {
          this.remotePlayer.updateState(data.transform, data.isGrounded, data.isMoving);
        }
      }
    };

    this.network.onPuzzleUpdated = (puzzle) => {
      this.localPuzzleState = puzzle;
    };

    this.network.onAbilityEvent = (data) => {
      if (data.playerId !== this.network.myPlayerId) {
        if (data.abilityType === 'platform') {
          soundSynth.playLumiPlatform();
          this.particles.emitSparkles(new THREE.Vector3(data.position.x, data.position.y, data.position.z), 16, 0xffd54f);
        } else {
          soundSynth.playNovaPulse();
          this.particles.emitPulseWave(new THREE.Vector3(data.position.x, data.position.y, data.position.z), 0x2ed8d8);
        }
      }
    };

    this.network.onHighFiveEvent = (data) => {
      soundSynth.playHighFive();
      this.particles.emitHearts(new THREE.Vector3(data.position.x, data.position.y, data.position.z), 18);
    };

    this.network.onEmoteEvent = (data) => {
      if (data.playerId !== this.network.myPlayerId && this.remotePlayer) {
        this.remotePlayer.triggerEmote(data.emote);
        this.particles.emitHearts(this.remotePlayer.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 12);
        this.ui.showToast(`Partner used emote: ${data.emote.toUpperCase()}!`);
      }
    };

    this.network.onCheckpointEvent = (data) => {
      this.currentCheckpointId = data.checkpointId;
      this.ui.setCheckpointTitle(data.name);
      soundSynth.playCheckpoint();
      this.ui.showToast(`Checkpoint Reached: ${data.name}`);
    };

    this.network.onLevelComplete = () => {
      this.isGameOver = true;
      if (this.player1) this.player1.model.celebrate();
      if (this.remotePlayer) this.remotePlayer.model.celebrate();
      if (this.player2) this.player2.model.celebrate();
      this.particles.emitHearts(new THREE.Vector3(0, 5, 134), 30);
      this.ui.showVictory();
    };

    this.network.onMessage = (data) => {
      this.ui.showToast(data.text);
    };
  }

  private startOnlineGame(room: RoomState) {
    this.cleanupPlayers();
    this.gameMode = 'online';
    this.isGameOver = false;

    // Find local and remote players
    const players = Object.values(room.players);
    const me = room.players[this.network.myPlayerId];
    const partner = players.find(p => p.id !== this.network.myPlayerId);

    const spawn1 = me.character === 'lumi' ? { x: -1.5, y: 1.5, z: 0 } : { x: 1.5, y: 1.5, z: 0 };
    this.player1 = new PlayerController(
      me.id,
      me.character,
      spawn1,
      this.physicsWorld,
      this.particles
    );
    this.sceneManager.scene.add(this.player1.model.group);

    if (partner) {
      const spawn2 = partner.character === 'lumi' ? { x: -1.5, y: 1.5, z: 0 } : { x: 1.5, y: 1.5, z: 0 };
      this.remotePlayer = new RemotePlayer(
        partner.id,
        partner.name,
        partner.character,
        spawn2
      );
      this.sceneManager.scene.add(this.remotePlayer.model.group);
    }

    this.localPuzzleState = room.puzzleState;
    this.ui.setupHUD('online', room.code, me.character);
    this.ui.showScreen('IN_GAME');
    this.ui.showToast('Online Co-Op Started! Cooperate to solve the islands!');
  }

  private startLocalGame() {
    this.cleanupPlayers();
    this.gameMode = 'local';
    this.isGameOver = false;

    // Player 1: Lumi (WASD + Q/E/Space)
    this.player1 = new PlayerController(
      'local-lumi',
      'lumi',
      { x: -1.5, y: 1.5, z: 0 },
      this.physicsWorld,
      this.particles
    );
    this.sceneManager.scene.add(this.player1.model.group);

    // Player 2: Nova (Arrows + K/L/Ctrl)
    this.player2 = new PlayerController(
      'local-nova',
      'nova',
      { x: 1.5, y: 1.5, z: 0 },
      this.physicsWorld,
      this.particles
    );
    this.sceneManager.scene.add(this.player2.model.group);

    // Initialize local puzzle state
    this.localPuzzleState = {
      trustBridge: { plateActive: false, leverActivated: false, isBridgeLockedOpen: false, bridgeProgress: 0.0 },
      magicalCrossing: { lumiPlatformActive: false, lumiPlatformTimeRemaining: 0, novaMechanismActive: false, movingPlatformProgress: 0.0 },
      heartGate: { switch1Active: false, switch2Active: false, switch1Timestamp: 0, switch2Timestamp: 0, isGateUnlocked: false, gateOpenProgress: 0.0 },
      completedChallenges: [],
      levelCompleted: false,
    };

    this.ui.setupHUD('local', undefined, 'lumi', 'nova');
    this.ui.showScreen('IN_GAME');
    this.ui.showToast('Local Co-Op: Player 1 [WASD] | Player 2 [Arrows]');
  }

  private cleanupPlayers() {
    if (this.player1) {
      this.sceneManager.scene.remove(this.player1.model.group);
      this.physicsWorld.removeRigidBody(this.player1.rigidBody);
      this.player1 = null;
    }
    if (this.player2) {
      this.sceneManager.scene.remove(this.player2.model.group);
      this.physicsWorld.removeRigidBody(this.player2.rigidBody);
      this.player2 = null;
    }
    if (this.remotePlayer) {
      this.sceneManager.scene.remove(this.remotePlayer.model.group);
      this.remotePlayer = null;
    }
  }

  private startLoop() {
    let lastTime = performance.now();

    const loop = (time: number) => {
      requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update input buffer timer
      this.inputManager.update(dt);

      if (this.gameMode === 'none') {
        // Living animated 3D menu camera showcase
        this.cameraController.updateMenuOrbit(dt);
      } else if (this.gameMode === 'online' && this.player1) {
        this.updateOnlineGame(dt);
      } else if (this.gameMode === 'local' && this.player1 && this.player2) {
        this.updateLocalGame(dt);
      }

      // Physics World Step
      this.physicsWorld.step();

      // Particles & Environment
      this.particles.update(dt);
      this.sceneManager.update(dt);

      // Render Scene
      this.sceneManager.render();

      // Update Performance Stats
      this.ui.updatePerformanceStats(this.sceneManager.getPerformanceStats());
    };

    requestAnimationFrame(loop);
  }

  private updateOnlineGame(dt: number) {
    if (!this.player1) return;

    const input = this.inputManager.getInput(this.inputManager.profile1KeyMap, true);
    const cameraYaw = this.cameraController.getYaw();

    // Update Player 1
    this.player1.update(input, cameraYaw, dt, (type, pos) => {
      this.network.sendAbility(type, pos);
    });

    // Update Camera with sprint FOV kick
    this.cameraController.updateSolo(this.player1.position, input.cameraDeltaX, input.cameraDeltaY, dt, input.sprint);

    // Update Remote Player
    if (this.remotePlayer) {
      this.remotePlayer.update(dt);
    }

    // Puzzle & Interactive checks
    this.handleInteractions(this.player1, input.interact);

    // Void fall check
    if (this.player1.position.y < PHYSICS.FALL_LIMIT_Y) {
      const cp = CHECKPOINTS[this.currentCheckpointId] || CHECKPOINTS[0];
      this.player1.teleport(cp.position.x, cp.position.y, cp.position.z);
      this.network.sendRespawn(this.currentCheckpointId);
      this.ui.showToast('Safe respawn at checkpoint!');
    }

    // Checkpoint detection
    for (const [idStr, cp] of Object.entries(CHECKPOINTS)) {
      const cpId = Number(idStr);
      if (cpId > this.currentCheckpointId) {
        const dist = this.player1.position.distanceTo(new THREE.Vector3(cp.position.x, cp.position.y, cp.position.z));
        if (dist < 4.0) {
          this.currentCheckpointId = cpId;
          this.network.setCheckpoint(cpId);
        }
      }
    }

    // Network transform broadcast at 30Hz
    const now = performance.now();
    if (now - this.lastNetworkSendTime > 1000 / 30) {
      this.lastNetworkSendTime = now;
      const tState: TransformState = {
        position: { x: this.player1.position.x, y: this.player1.position.y, z: this.player1.position.z },
        rotation: {
          x: this.player1.model.group.quaternion.x,
          y: this.player1.model.group.quaternion.y,
          z: this.player1.model.group.quaternion.z,
          w: this.player1.model.group.quaternion.w,
        },
        velocity: { x: this.player1.velocity.x, y: this.player1.velocity.y, z: this.player1.velocity.z },
      };
      this.network.sendTransform(tState, this.player1.isGrounded, this.player1.isMoving);
    }

    // Update Puzzle Visuals
    if (this.localPuzzleState) {
      this.level.updatePuzzleVisuals(this.localPuzzleState, dt);
    }

    // Partner Distance
    let partnerDist = 0;
    if (this.remotePlayer) {
      partnerDist = this.player1.position.distanceTo(this.remotePlayer.position);
    }
    this.ui.updateHUD(this.player1.getCooldownPercent(), partnerDist);
    this.ui.setModelVersion(this.player1.model.modelVersion);
  }

  private updateLocalGame(dt: number) {
    if (!this.player1 || !this.player2) return;

    // Player 1 input (WASD + Q/E/Space)
    const p1Input = this.inputManager.getInput(this.inputManager.profile1KeyMap, false);
    // Player 2 input (Arrows + K/L/Enter)
    const p2Input = this.inputManager.getInput(this.inputManager.profile2KeyMap, false);

    const cameraYaw = 0; // Fixed framing yaw in local co-op

    // Update Player 1
    this.player1.update(p1Input, cameraYaw, dt, (type, pos) => {
      if (type === 'platform' && this.localPuzzleState) {
        this.localPuzzleState.magicalCrossing.lumiPlatformActive = true;
        this.localPuzzleState.magicalCrossing.lumiPlatformPosition = pos;
        this.localPuzzleState.magicalCrossing.lumiPlatformTimeRemaining = ABILITIES.LUMI_PLATFORM_DURATION_SEC;
      }
    });

    // Update Player 2
    this.player2.update(p2Input, cameraYaw, dt, (type, pos) => {
      if (type === 'pulse' && this.localPuzzleState) {
        const distToMech = this.player2!.position.distanceTo(this.level.novaMechanismPos);
        if (distToMech < ABILITIES.NOVA_PULSE_RADIUS * 1.5) {
          this.localPuzzleState.magicalCrossing.novaMechanismActive = true;
          this.ui.showToast('Nova energized the spires! Platform is moving!');
        }
      }
    });

    // Dynamic dual camera framing
    this.cameraController.updateDual(this.player1.position, this.player2.position, dt);

    // Update local puzzle state machine
    this.tickLocalPuzzles(dt, p1Input.interact, p2Input.interact);

    // Void respawn
    for (const player of [this.player1, this.player2]) {
      if (player.position.y < PHYSICS.FALL_LIMIT_Y) {
        const cp = CHECKPOINTS[this.currentCheckpointId] || CHECKPOINTS[0];
        player.teleport(cp.position.x, cp.position.y, cp.position.z);
        this.ui.showToast('Safe respawn at checkpoint!');
      }
    }

    // Checkpoint check
    for (const [idStr, cp] of Object.entries(CHECKPOINTS)) {
      const cpId = Number(idStr);
      if (cpId > this.currentCheckpointId) {
        const p1Dist = this.player1.position.distanceTo(new THREE.Vector3(cp.position.x, cp.position.y, cp.position.z));
        const p2Dist = this.player2.position.distanceTo(new THREE.Vector3(cp.position.x, cp.position.y, cp.position.z));
        if (p1Dist < 4.0 || p2Dist < 4.0) {
          this.currentCheckpointId = cpId;
          this.ui.setCheckpointTitle(cp.name);
          soundSynth.playCheckpoint();
          this.ui.showToast(`Checkpoint Reached: ${cp.name}`);
        }
      }
    }

    // Victory check: both reach shrine (Z > 125)
    if (!this.isGameOver && this.localPuzzleState?.heartGate.isGateUnlocked) {
      if (this.player1.position.z > 125 && this.player2.position.z > 125) {
        this.isGameOver = true;
        this.player1.model.celebrate();
        this.player2.model.celebrate();
        this.particles.emitHearts(new THREE.Vector3(0, 5, 134), 30);
        this.ui.showVictory();
      }
    }

    // Update visuals
    if (this.localPuzzleState) {
      this.level.updatePuzzleVisuals(this.localPuzzleState, dt);
    }

    // Distance & HUD
    const partnerDist = this.player1.position.distanceTo(this.player2.position);
    this.ui.updateHUD(
      this.player1.getCooldownPercent(),
      partnerDist,
      this.player2.getCooldownPercent()
    );
    this.ui.setModelVersion(this.player1.model.modelVersion);
  }

  private handleInteractions(player: PlayerController, interactPressed: boolean) {
    let promptVisible = false;
    let promptText = '';

    // 1. High-Five with remote player
    if (this.remotePlayer) {
      const dist = player.position.distanceTo(this.remotePlayer.position);
      if (dist <= ABILITIES.HIGHFIVE_DISTANCE * 1.5) {
        promptVisible = true;
        promptText = 'High-Five Partner!';
        if (interactPressed) {
          this.network.sendInteract('highfive');
        }
      }
    }

    // 2. Challenge 1: Pressure plate
    const distToPlate = player.position.distanceTo(this.level.pressurePlatePos);
    const onPlate = distToPlate < 1.4 && player.position.y <= 1.2;
    if (this.gameMode === 'online') {
      // Plate activates automatically when standing on it
      if (this.localPuzzleState?.trustBridge.plateActive !== onPlate) {
        this.network.sendInteract('switch', onPlate ? 'plate_on' : 'plate_off');
      }
    }

    // 3. Challenge 1: Lever
    const distToLever = player.position.distanceTo(this.level.leverPos);
    if (distToLever < 2.0 && !this.localPuzzleState?.trustBridge.isBridgeLockedOpen) {
      promptVisible = true;
      promptText = 'Lock Trust Bridge';
      if (interactPressed) {
        this.network.sendInteract('lever');
      }
    }

    // 4. Challenge 3: Heart Switches
    const distToSw1 = player.position.distanceTo(this.level.switch1Pos);
    if (distToSw1 < 2.0 && !this.localPuzzleState?.heartGate.isGateUnlocked) {
      promptVisible = true;
      promptText = 'Activate Left Heart Switch';
      if (interactPressed) {
        soundSynth.playSwitch();
        this.network.sendInteract('switch', 'switch1');
      }
    }

    const distToSw2 = player.position.distanceTo(this.level.switch2Pos);
    if (distToSw2 < 2.0 && !this.localPuzzleState?.heartGate.isGateUnlocked) {
      promptVisible = true;
      promptText = 'Activate Right Heart Switch';
      if (interactPressed) {
        soundSynth.playSwitch();
        this.network.sendInteract('switch', 'switch2');
      }
    }

    this.ui.setInteractPrompt(promptVisible, promptText);
  }

  private tickLocalPuzzles(dt: number, p1Interact: boolean, p2Interact: boolean) {
    if (!this.localPuzzleState || !this.player1 || !this.player2) return;

    // Challenge 1: Pressure Plate (either player stepping on it)
    const p1OnPlate = this.player1.position.distanceTo(this.level.pressurePlatePos) < 1.4;
    const p2OnPlate = this.player2.position.distanceTo(this.level.pressurePlatePos) < 1.4;
    this.localPuzzleState.trustBridge.plateActive = p1OnPlate || p2OnPlate;

    // Challenge 1: Lever
    const p1AtLever = this.player1.position.distanceTo(this.level.leverPos) < 2.0 && p1Interact;
    const p2AtLever = this.player2.position.distanceTo(this.level.leverPos) < 2.0 && p2Interact;
    if ((p1AtLever || p2AtLever) && !this.localPuzzleState.trustBridge.leverActivated) {
      this.localPuzzleState.trustBridge.leverActivated = true;
      this.localPuzzleState.trustBridge.isBridgeLockedOpen = true;
      soundSynth.playSwitch();
      this.ui.showToast('Trust Bridge locked permanently open!');
    }

    // Bridge progress animation
    const bridgeTarget = (this.localPuzzleState.trustBridge.plateActive || this.localPuzzleState.trustBridge.isBridgeLockedOpen) ? 1.0 : 0.0;
    this.localPuzzleState.trustBridge.bridgeProgress = THREE.MathUtils.damp(
      this.localPuzzleState.trustBridge.bridgeProgress,
      bridgeTarget,
      3.0,
      dt
    );

    // Challenge 2: Lumi Platform Timer
    if (this.localPuzzleState.magicalCrossing.lumiPlatformActive) {
      this.localPuzzleState.magicalCrossing.lumiPlatformTimeRemaining -= dt;
      if (this.localPuzzleState.magicalCrossing.lumiPlatformTimeRemaining <= 0) {
        this.localPuzzleState.magicalCrossing.lumiPlatformActive = false;
        this.localPuzzleState.magicalCrossing.lumiPlatformPosition = undefined;
      }
    }

    // Challenge 2: Moving Platform
    if (this.localPuzzleState.magicalCrossing.novaMechanismActive) {
      this.localPuzzleState.magicalCrossing.movingPlatformProgress = 
        (this.localPuzzleState.magicalCrossing.movingPlatformProgress + dt * 0.35) % 1.0;
    }

    // Challenge 3: Heart Switches
    const now = Date.now();
    const p1Sw1 = this.player1.position.distanceTo(this.level.switch1Pos) < 2.0 && p1Interact;
    const p2Sw1 = this.player2.position.distanceTo(this.level.switch1Pos) < 2.0 && p2Interact;
    if (p1Sw1 || p2Sw1) {
      this.localPuzzleState.heartGate.switch1Active = true;
      this.localPuzzleState.heartGate.switch1Timestamp = now;
      soundSynth.playSwitch();
    }

    const p1Sw2 = this.player1.position.distanceTo(this.level.switch2Pos) < 2.0 && p1Interact;
    const p2Sw2 = this.player2.position.distanceTo(this.level.switch2Pos) < 2.0 && p2Interact;
    if (p1Sw2 || p2Sw2) {
      this.localPuzzleState.heartGate.switch2Active = true;
      this.localPuzzleState.heartGate.switch2Timestamp = now;
      soundSynth.playSwitch();
    }

    // Heart Gate unlock check
    if (!this.localPuzzleState.heartGate.isGateUnlocked) {
      const timeDiff = Math.abs(this.localPuzzleState.heartGate.switch1Timestamp - this.localPuzzleState.heartGate.switch2Timestamp);
      if (this.localPuzzleState.heartGate.switch1Active && this.localPuzzleState.heartGate.switch2Active && timeDiff <= 1800) {
        this.localPuzzleState.heartGate.isGateUnlocked = true;
        soundSynth.playCheckpoint();
        this.particles.emitHearts(new THREE.Vector3(0, 4.5, 120), 25);
        this.ui.showToast('Heart Gate Unlocked! Enter the Summit!');
      }
    }

    // Gate door animation
    if (this.localPuzzleState.heartGate.isGateUnlocked) {
      this.localPuzzleState.heartGate.gateOpenProgress = Math.min(1.0, this.localPuzzleState.heartGate.gateOpenProgress + dt * 0.8);
    }

    // Local High-Five
    const dist = this.player1.position.distanceTo(this.player2.position);
    if (dist < ABILITIES.HIGHFIVE_DISTANCE * 1.5 && (p1Interact || p2Interact)) {
      const mid = new THREE.Vector3().addVectors(this.player1.position, this.player2.position).multiplyScalar(0.5);
      soundSynth.playHighFive();
      this.particles.emitHearts(mid, 16);
      this.ui.showToast('High-Five! Cozy teamwork!');
    }
  }
}
