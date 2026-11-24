export interface InputState {
  forward: number;
  right: number;
  jump: boolean;
  jumpPressed: boolean;
  sprint: boolean;
  interact: boolean;
  ability: boolean;
  cameraDeltaX: number;
  cameraDeltaY: number;
}

export interface KeyMap {
  forward: string[];
  backward: string[];
  left: string[];
  right: string[];
  jump: string[];
  sprint: string[];
  interact: string[];
  ability: string[];
}

export class InputManager {
  private activeKeys: Set<string> = new Set();
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerLocked: boolean = false;
  private jumpBufferTimer: number = 0;

  // Key configurations for single/online and local dual-players
  public profile1KeyMap: KeyMap = {
    forward: ['KeyW', 'ArrowUp'],
    backward: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['Space'],
    sprint: ['ShiftLeft'],
    interact: ['KeyE'],
    ability: ['KeyQ'],
  };

  // Dedicated Player 2 keymap for shared keyboard local play
  public profile2KeyMap: KeyMap = {
    forward: ['ArrowUp'],
    backward: ['ArrowDown'],
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    jump: ['Numpad0', 'ControlRight', 'Slash'],
    sprint: ['ShiftRight'],
    interact: ['Enter', 'KeyL'],
    ability: ['KeyK', 'Numpad1'],
  };

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.activeKeys.add(e.code);
      if (e.code === 'Space') {
        this.jumpBufferTimer = 0.12; // 120ms jump buffer
      }
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  public requestPointerLock(element: HTMLElement) {
    if (!this.isPointerLocked) {
      element.requestPointerLock().catch(() => {});
    }
  }

  public update(dt: number) {
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }
  }

  public getInput(map: KeyMap, isPlayer1Solo: boolean = true): InputState {
    const isDown = (keys: string[]) => keys.some((k) => this.activeKeys.has(k));

    let forward = 0;
    let right = 0;

    if (isDown(map.forward)) forward += 1;
    if (isDown(map.backward)) forward -= 1;
    if (isDown(map.right)) right += 1;
    if (isDown(map.left)) right -= 1;

    const jump = isDown(map.jump);
    const jumpPressed = this.jumpBufferTimer > 0;
    const sprint = isDown(map.sprint);
    const interact = isDown(map.interact);
    const ability = isDown(map.ability);

    const deltaX = isPlayer1Solo ? this.mouseDeltaX : 0;
    const deltaY = isPlayer1Solo ? this.mouseDeltaY : 0;

    // Reset mouse deltas after consuming
    if (isPlayer1Solo) {
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    }

    return {
      forward,
      right,
      jump,
      jumpPressed,
      sprint,
      interact,
      ability,
      cameraDeltaX: deltaX,
      cameraDeltaY: deltaY,
    };
  }

  public consumeJumpBuffer() {
    this.jumpBufferTimer = 0;
  }
}
