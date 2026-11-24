import { Server, Socket } from 'socket.io';
import {
  ABILITIES,
  CHECKPOINTS,
  CharacterType,
  ClientToServerEvents,
  PlayerState,
  PuzzleState,
  RoomPlayer,
  RoomState,
  ServerToClientEvents,
  TransformState,
  Vector3D
} from '@together-apart/shared';
import { PuzzleEngine } from './PuzzleEngine';

export class GameRoom {
  public code: string;
  public createdAt: number;
  public inGame: boolean = false;
  public players: Map<string, RoomPlayer> = new Map();
  public playerStates: Map<string, PlayerState> = new Map();
  
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private puzzleEngine: PuzzleEngine;
  private tickInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = Date.now();

  constructor(code: string, io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.code = code;
    this.io = io;
    this.createdAt = Date.now();
    this.puzzleEngine = new PuzzleEngine((puzzleState) => {
      this.io.to(this.code).emit('puzzle:updated', puzzleState);
    });
  }

  public addPlayer(socket: Socket, name: string, preferredCharacter?: CharacterType): { success: boolean; error?: string } {
    if (this.players.size >= 2) {
      return { success: false, error: 'Room is already full (max 2 players).' };
    }

    // Determine character: Lumi if free, Nova if Lumi taken, or preferred
    let character: CharacterType = 'lumi';
    const existingPlayer = Array.from(this.players.values())[0];
    if (existingPlayer) {
      character = existingPlayer.character === 'lumi' ? 'nova' : 'lumi';
    } else if (preferredCharacter) {
      character = preferredCharacter;
    }

    const roomPlayer: RoomPlayer = {
      id: socket.id,
      name: name.trim() || (character === 'lumi' ? 'Lumi' : 'Nova'),
      character,
      ready: false,
      connected: true,
      ping: 0,
    };

    const initialSpawn = CHECKPOINTS[0].position;
    const playerState: PlayerState = {
      id: socket.id,
      name: roomPlayer.name,
      character,
      ready: false,
      connected: true,
      transform: {
        position: { x: character === 'lumi' ? -1.5 : 1.5, y: initialSpawn.y, z: initialSpawn.z },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
      },
      isGrounded: true,
      isMoving: false,
      isEmoting: false,
      checkpointId: 0,
      lastActiveTimestamp: Date.now(),
    };

    this.players.set(socket.id, roomPlayer);
    this.playerStates.set(socket.id, playerState);

    socket.join(this.code);
    this.broadcastRoomUpdate();
    return { success: true };
  }

  public removePlayer(socketId: string) {
    this.players.delete(socketId);
    this.playerStates.delete(socketId);
    this.io.to(this.code).emit('room:player_left', socketId);
    this.broadcastRoomUpdate();

    if (this.players.size === 0) {
      this.stopGameLoop();
    }
  }

  public setCharacter(socketId: string, character: CharacterType) {
    const player = this.players.get(socketId);
    if (!player) return;

    // Check if other player already chose this character
    for (const [id, p] of this.players.entries()) {
      if (id !== socketId && p.character === character) {
        // Swap characters
        p.character = player.character;
        const otherState = this.playerStates.get(id);
        if (otherState) otherState.character = p.character;
        break;
      }
    }

    player.character = character;
    const state = this.playerStates.get(socketId);
    if (state) state.character = character;

    this.broadcastRoomUpdate();
  }

  public setReady(socketId: string, ready: boolean) {
    const player = this.players.get(socketId);
    if (!player) return;
    player.ready = ready;

    const state = this.playerStates.get(socketId);
    if (state) state.ready = ready;

    this.broadcastRoomUpdate();
  }

  public startGame(): boolean {
    if (this.players.size < 1) return false;
    
    // In online mode, 2 players must be ready
    const allReady = Array.from(this.players.values()).every(p => p.ready);
    if (this.players.size === 2 && !allReady) {
      return false;
    }

    this.inGame = true;
    this.startGameLoop();
    this.io.to(this.code).emit('game:started', this.getRoomState());
    this.io.to(this.code).emit('event:message', {
      text: 'Journey begins on The Island of Connection! Work together!',
      kind: 'encouragement'
    });
    return true;
  }

  public updatePlayerTransform(socketId: string, transform: TransformState, isGrounded: boolean, isMoving: boolean) {
    const state = this.playerStates.get(socketId);
    if (!state) return;
    state.transform = transform;
    state.isGrounded = isGrounded;
    state.isMoving = isMoving;
    state.lastActiveTimestamp = Date.now();
  }

  public handleAbility(socketId: string, abilityType: 'platform' | 'pulse', position: Vector3D) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (player.character === 'lumi' && abilityType === 'platform') {
      this.puzzleEngine.spawnLumiPlatform(position);
    } else if (player.character === 'nova' && abilityType === 'pulse') {
      // Check if near Nova's mechanism for Challenge 2 (x: 4.0, y: 2.5, z: 72.0)
      const distToMech = Math.hypot(position.x - 4.0, position.y - 2.5, position.z - 72.0);
      if (distToMech < ABILITIES.NOVA_PULSE_RADIUS * 1.5) {
        this.puzzleEngine.activateNovaMechanism();
        this.io.to(this.code).emit('event:message', {
          text: 'Nova energized the magnetic spires! The floating platform is moving!',
          kind: 'success'
        });
      }
    }

    // Broadcast ability event to both clients for particles and SFX
    this.io.to(this.code).emit('event:ability', {
      playerId: socketId,
      character: player.character,
      abilityType,
      position
    });
  }

  public handleInteract(socketId: string, action: 'highfive' | 'switch' | 'lever', targetId?: string) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (action === 'highfive') {
      // Check distance to partner
      const playersList = Array.from(this.playerStates.values());
      if (playersList.length === 2) {
        const p1 = playersList[0];
        const p2 = playersList[1];
        const dist = Math.hypot(
          p1.transform.position.x - p2.transform.position.x,
          p1.transform.position.y - p2.transform.position.y,
          p1.transform.position.z - p2.transform.position.z
        );

        if (dist <= ABILITIES.HIGHFIVE_DISTANCE * 1.5) {
          const midPos: Vector3D = {
            x: (p1.transform.position.x + p2.transform.position.x) / 2,
            y: (p1.transform.position.y + p2.transform.position.y) / 2 + 0.8,
            z: (p1.transform.position.z + p2.transform.position.z) / 2,
          };
          this.io.to(this.code).emit('event:highfive', {
            player1Id: p1.id,
            player2Id: p2.id,
            position: midPos,
          });
          this.io.to(this.code).emit('event:message', {
            text: 'High-Five! Together, nothing can stop you!',
            kind: 'success',
          });
        }
      }
    } else if (targetId === 'plate_on') {
      this.handlePressurePlate(true);
    } else if (targetId === 'plate_off') {
      this.handlePressurePlate(false);
    } else if (action === 'lever') {
      const activated = this.puzzleEngine.activateLever();
      if (activated) {
        this.io.to(this.code).emit('event:message', {
          text: 'Trust Bridge locked permanently open! Both can cross safely!',
          kind: 'success',
        });
      }
    } else if (action === 'switch') {
      const switchNum = targetId === 'switch2' ? 2 : 1;
      const result = this.puzzleEngine.activateHeartSwitch(switchNum);
      if (result.message) {
        this.io.to(this.code).emit('event:message', {
          text: result.message,
          kind: result.unlocked ? 'success' : 'info',
        });
      }
    }
  }

  public handlePressurePlate(active: boolean) {
    this.puzzleEngine.setPressurePlate(active);
  }

  public handleRespawn(socketId: string, checkpointId: number) {
    const state = this.playerStates.get(socketId);
    if (!state) return;
    const cp = CHECKPOINTS[checkpointId] || CHECKPOINTS[0];
    state.checkpointId = checkpointId;
    state.transform.position = { ...cp.position };
    state.transform.velocity = { x: 0, y: 0, z: 0 };
  }

  public setCheckpoint(checkpointId: number) {
    const cp = CHECKPOINTS[checkpointId];
    if (!cp) return;

    for (const state of this.playerStates.values()) {
      if (state.checkpointId < checkpointId) {
        state.checkpointId = checkpointId;
      }
    }

    this.io.to(this.code).emit('event:checkpoint', {
      checkpointId,
      name: cp.name,
    });
    this.io.to(this.code).emit('event:message', {
      text: `Reached checkpoint: ${cp.name}`,
      kind: 'info',
    });
  }

  private startGameLoop() {
    if (this.tickInterval) return;
    this.lastTickTime = Date.now();

    // 30 Hz tick loop for network broadcast and puzzle updates
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      const dt = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      // Update puzzle physics & timers
      this.puzzleEngine.update(dt);

      // Check level completion
      const playerArray = Array.from(this.playerStates.values());
      if (playerArray.length >= 2) {
        const completed = this.puzzleEngine.checkLevelCompletion(
          playerArray[0].transform.position,
          playerArray[1].transform.position
        );
        if (completed) {
          this.io.to(this.code).emit('event:level_complete');
          this.io.to(this.code).emit('event:message', {
            text: 'VICTORY! You connected your hearts and mastered the Island of Connection!',
            kind: 'success',
          });
        }
      }

      // Broadcast position/rotation tick
      const tickData: Record<string, { transform: TransformState; isGrounded: boolean; isMoving: boolean }> = {};
      for (const [id, state] of this.playerStates.entries()) {
        tickData[id] = {
          transform: state.transform,
          isGrounded: state.isGrounded,
          isMoving: state.isMoving,
        };
      }

      this.io.to(this.code).emit('state:tick', {
        players: tickData,
        timestamp: now,
      });
    }, 1000 / 30);
  }

  private stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public getRoomState(): RoomState {
    const playersObj: Record<string, RoomPlayer> = {};
    for (const [id, p] of this.players.entries()) {
      playersObj[id] = p;
    }
    const checkpointsObj: Record<number, Vector3D> = {};
    for (const [id, cp] of Object.entries(CHECKPOINTS)) {
      checkpointsObj[Number(id)] = cp.position;
    }

    return {
      code: this.code,
      createdAt: this.createdAt,
      inGame: this.inGame,
      players: playersObj,
      puzzleState: this.puzzleEngine.state,
      checkpoints: checkpointsObj,
    };
  }

  public broadcastRoomUpdate() {
    this.io.to(this.code).emit('room:updated', this.getRoomState());
  }
}
