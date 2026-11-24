export type CharacterType = 'lumi' | 'nova';
export type EmoteType = 'wave' | 'highfive' | 'hug' | 'dance' | 'celebrate';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface TransformState {
  position: Vector3D;
  rotation: Quaternion4D;
  velocity: Vector3D;
}

export interface PlayerInput {
  forward: number;  // -1 to 1
  right: number;    // -1 to 1
  jump: boolean;
  sprint: boolean;
  interact: boolean;
  ability: boolean;
  cameraYaw: number;
}

export interface PlayerState {
  id: string;
  name: string;
  character: CharacterType;
  ready: boolean;
  connected: boolean;
  transform: TransformState;
  isGrounded: boolean;
  isMoving: boolean;
  isEmoting: boolean;
  emoteType?: 'highfive' | 'cheer' | 'heart';
  checkpointId: number;
  lastActiveTimestamp: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  character: CharacterType;
  ready: boolean;
  connected: boolean;
  ping: number;
}

export interface TrustBridgeState {
  plateActive: boolean;
  leverActivated: boolean;
  isBridgeLockedOpen: boolean;
  bridgeProgress: number; // 0.0 (closed) to 1.0 (fully open)
}

export interface MagicalCrossingState {
  lumiPlatformActive: boolean;
  lumiPlatformPosition?: Vector3D;
  lumiPlatformTimeRemaining: number; // seconds
  novaMechanismActive: boolean;
  movingPlatformProgress: number; // 0.0 to 1.0
}

export interface HeartGateState {
  switch1Active: boolean;
  switch2Active: boolean;
  switch1Timestamp: number;
  switch2Timestamp: number;
  isGateUnlocked: boolean;
  gateOpenProgress: number; // 0.0 to 1.0
}

export interface PuzzleState {
  trustBridge: TrustBridgeState;
  magicalCrossing: MagicalCrossingState;
  heartGate: HeartGateState;
  completedChallenges: number[]; // [1, 2, 3]
  levelCompleted: boolean;
}

export interface RoomState {
  code: string;
  createdAt: number;
  inGame: boolean;
  players: Record<string, RoomPlayer>;
  puzzleState: PuzzleState;
  checkpoints: Record<number, Vector3D>;
}
