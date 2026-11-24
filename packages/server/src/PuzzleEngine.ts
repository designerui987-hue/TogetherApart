import {
  ABILITIES,
  CHECKPOINTS,
  HeartGateState,
  MagicalCrossingState,
  PUZZLE_TIMINGS,
  PuzzleState,
  TrustBridgeState,
  Vector3D
} from '@together-apart/shared';

export class PuzzleEngine {
  public state: PuzzleState;
  private onChangeCallback: (state: PuzzleState) => void;

  constructor(onChange: (state: PuzzleState) => void) {
    this.onChangeCallback = onChange;
    this.state = this.createInitialState();
  }

  private createInitialState(): PuzzleState {
    return {
      trustBridge: {
        plateActive: false,
        leverActivated: false,
        isBridgeLockedOpen: false,
        bridgeProgress: 0.0,
      },
      magicalCrossing: {
        lumiPlatformActive: false,
        lumiPlatformPosition: undefined,
        lumiPlatformTimeRemaining: 0,
        novaMechanismActive: false,
        movingPlatformProgress: 0.0,
      },
      heartGate: {
        switch1Active: false,
        switch2Active: false,
        switch1Timestamp: 0,
        switch2Timestamp: 0,
        isGateUnlocked: false,
        gateOpenProgress: 0.0,
      },
      completedChallenges: [],
      levelCompleted: false,
    };
  }

  public update(dt: number) {
    let changed = false;

    // Challenge 1: Trust bridge animation progress
    const bridgeTarget = (this.state.trustBridge.plateActive || this.state.trustBridge.isBridgeLockedOpen) ? 1.0 : 0.0;
    if (this.state.trustBridge.bridgeProgress !== bridgeTarget) {
      const step = (dt / PUZZLE_TIMINGS.BRIDGE_TRANSITION_SPEED);
      if (this.state.trustBridge.bridgeProgress < bridgeTarget) {
        this.state.trustBridge.bridgeProgress = Math.min(1.0, this.state.trustBridge.bridgeProgress + step);
      } else {
        this.state.trustBridge.bridgeProgress = Math.max(0.0, this.state.trustBridge.bridgeProgress - step);
      }
      changed = true;
    }

    // Challenge 2: Lumi platform timer
    if (this.state.magicalCrossing.lumiPlatformActive) {
      this.state.magicalCrossing.lumiPlatformTimeRemaining -= dt;
      if (this.state.magicalCrossing.lumiPlatformTimeRemaining <= 0) {
        this.state.magicalCrossing.lumiPlatformActive = false;
        this.state.magicalCrossing.lumiPlatformPosition = undefined;
        this.state.magicalCrossing.lumiPlatformTimeRemaining = 0;
        changed = true;
      }
    }

    // Challenge 2: Nova moving platform animation
    if (this.state.magicalCrossing.novaMechanismActive) {
      this.state.magicalCrossing.movingPlatformProgress = 
        (this.state.magicalCrossing.movingPlatformProgress + dt * PUZZLE_TIMINGS.MOVING_PLATFORM_SPEED) % 1.0;
      changed = true;
    }

    // Challenge 3: Heart gate open animation
    if (this.state.heartGate.isGateUnlocked && this.state.heartGate.gateOpenProgress < 1.0) {
      this.state.heartGate.gateOpenProgress = Math.min(1.0, this.state.heartGate.gateOpenProgress + dt * 0.7);
      changed = true;
    }

    // Challenge 3: Reset un-synchronized switches after window expires
    const now = Date.now();
    if (!this.state.heartGate.isGateUnlocked) {
      if (this.state.heartGate.switch1Active && now - this.state.heartGate.switch1Timestamp > PUZZLE_TIMINGS.HEART_GATE_SYNC_WINDOW_MS) {
        this.state.heartGate.switch1Active = false;
        changed = true;
      }
      if (this.state.heartGate.switch2Active && now - this.state.heartGate.switch2Timestamp > PUZZLE_TIMINGS.HEART_GATE_SYNC_WINDOW_MS) {
        this.state.heartGate.switch2Active = false;
        changed = true;
      }
    }

    if (changed) {
      this.onChangeCallback(this.state);
    }
  }

  // Challenge 1 Actions
  public setPressurePlate(active: boolean): boolean {
    if (this.state.trustBridge.plateActive !== active) {
      this.state.trustBridge.plateActive = active;
      this.onChangeCallback(this.state);
      return true;
    }
    return false;
  }

  public activateLever(): boolean {
    if (!this.state.trustBridge.leverActivated) {
      this.state.trustBridge.leverActivated = true;
      this.state.trustBridge.isBridgeLockedOpen = true;
      if (!this.state.completedChallenges.includes(1)) {
        this.state.completedChallenges.push(1);
      }
      this.onChangeCallback(this.state);
      return true;
    }
    return false;
  }

  // Challenge 2 Actions
  public spawnLumiPlatform(position: Vector3D): boolean {
    this.state.magicalCrossing.lumiPlatformActive = true;
    this.state.magicalCrossing.lumiPlatformPosition = position;
    this.state.magicalCrossing.lumiPlatformTimeRemaining = ABILITIES.LUMI_PLATFORM_DURATION_SEC;
    this.onChangeCallback(this.state);
    return true;
  }

  public activateNovaMechanism(): boolean {
    this.state.magicalCrossing.novaMechanismActive = true;
    if (!this.state.completedChallenges.includes(2)) {
      this.state.completedChallenges.push(2);
    }
    this.onChangeCallback(this.state);
    return true;
  }

  // Challenge 3 Actions
  public activateHeartSwitch(switchNumber: 1 | 2): { unlocked: boolean; message?: string } {
    if (this.state.heartGate.isGateUnlocked) {
      return { unlocked: true };
    }

    const now = Date.now();
    if (switchNumber === 1) {
      this.state.heartGate.switch1Active = true;
      this.state.heartGate.switch1Timestamp = now;
    } else {
      this.state.heartGate.switch2Active = true;
      this.state.heartGate.switch2Timestamp = now;
    }

    // Check if both are active within the sync window
    const timeDiff = Math.abs(this.state.heartGate.switch1Timestamp - this.state.heartGate.switch2Timestamp);
    if (this.state.heartGate.switch1Active && this.state.heartGate.switch2Active && timeDiff <= PUZZLE_TIMINGS.HEART_GATE_SYNC_WINDOW_MS) {
      this.state.heartGate.isGateUnlocked = true;
      if (!this.state.completedChallenges.includes(3)) {
        this.state.completedChallenges.push(3);
      }
      this.onChangeCallback(this.state);
      return { unlocked: true, message: 'Heart Gate unlocked with perfect synchronization!' };
    }

    this.onChangeCallback(this.state);
    return { unlocked: false, message: `Switch ${switchNumber} activated! Partner activate switch now!` };
  }

  public checkLevelCompletion(p1Pos: Vector3D, p2Pos: Vector3D): boolean {
    if (this.state.levelCompleted) return true;
    if (!this.state.heartGate.isGateUnlocked) return false;

    // Both players must reach the victory shrine platform (Z > 125)
    if (p1Pos.z > 125 && p2Pos.z > 125) {
      this.state.levelCompleted = true;
      this.onChangeCallback(this.state);
      return true;
    }
    return false;
  }
}
