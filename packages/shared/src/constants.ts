import { Vector3D } from './types';

export const PHYSICS = {
  GRAVITY: -22.0,
  WALK_SPEED: 6.0,
  SPRINT_SPEED: 9.5,
  ACCELERATION: 35.0,
  DECELERATION: 25.0,
  AIR_CONTROL: 0.45,
  JUMP_FORCE: 9.2,
  COYOTE_TIME_MS: 140,
  JUMP_BUFFER_MS: 120,
  FALL_LIMIT_Y: -15.0,
  CHARACTER_RADIUS: 0.45,
  CHARACTER_HEIGHT: 1.2,
};

export const ABILITIES = {
  LUMI_PLATFORM_DURATION_SEC: 6.0,
  LUMI_PLATFORM_COOLDOWN_SEC: 7.0,
  NOVA_PULSE_RADIUS: 4.5,
  NOVA_PULSE_COOLDOWN_SEC: 3.5,
  HIGHFIVE_DISTANCE: 2.2,
};

export const CHECKPOINTS: Record<number, { name: string; position: Vector3D }> = {
  0: { name: 'Arrival Meadow', position: { x: 0, y: 1.5, z: 0 } },
  1: { name: 'Trust Bridge Plateau', position: { x: 0, y: 1.5, z: 28 } },
  2: { name: 'Crystal Spires', position: { x: 0, y: 3.0, z: 65 } },
  3: { name: 'Heart Gate Sanctuary', position: { x: 0, y: 4.5, z: 110 } },
};

export const PUZZLE_TIMINGS = {
  HEART_GATE_SYNC_WINDOW_MS: 1800, // Tolerance for simultaneous switch press
  BRIDGE_TRANSITION_SPEED: 2.0,   // seconds to open/close
  MOVING_PLATFORM_SPEED: 0.35,    // cycle speed
};
