import { io, Socket } from 'socket.io-client';
import {
  CharacterType,
  ClientToServerEvents,
  EmoteType,
  PlayerState,
  PuzzleState,
  RoomPlayer,
  RoomState,
  ServerToClientEvents,
  TransformState,
  Vector3D
} from '@together-apart/shared';

export class NetworkClient {
  public socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  public isConnected: boolean = false;
  public roomState: RoomState | null = null;
  public myPlayerId: string = '';
  public pingMs: number = 0;

  // Callbacks
  public onRoomUpdated?: (room: RoomState) => void;
  public onGameStarted?: (room: RoomState) => void;
  public onStateTick?: (players: Record<string, { transform: TransformState; isGrounded: boolean; isMoving: boolean }>) => void;
  public onPuzzleUpdated?: (puzzle: PuzzleState) => void;
  public onAbilityEvent?: (data: { playerId: string; character: CharacterType; abilityType: 'platform' | 'pulse'; position: Vector3D }) => void;
  public onHighFiveEvent?: (data: { position: Vector3D }) => void;
  public onEmoteEvent?: (data: { playerId: string; emote: EmoteType }) => void;
  public onCheckpointEvent?: (data: { checkpointId: number; name: string }) => void;
  public onLevelComplete?: () => void;
  public onMessage?: (data: { text: string; kind?: 'info' | 'encouragement' | 'success' }) => void;

  constructor() {
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.myPlayerId = this.socket.id || '';
      console.log(`[NetworkClient] Connected with id: ${this.myPlayerId}`);
      this.measurePing();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('[NetworkClient] Disconnected from server');
    });

    this.socket.on('room:updated', (room) => {
      this.roomState = room;
      if (this.onRoomUpdated) this.onRoomUpdated(room);
    });

    this.socket.on('game:started', (room) => {
      this.roomState = room;
      if (this.onGameStarted) this.onGameStarted(room);
    });

    this.socket.on('state:tick', (data) => {
      if (this.onStateTick) this.onStateTick(data.players);
    });

    this.socket.on('puzzle:updated', (puzzle) => {
      if (this.roomState) this.roomState.puzzleState = puzzle;
      if (this.onPuzzleUpdated) this.onPuzzleUpdated(puzzle);
    });

    this.socket.on('event:ability', (data) => {
      if (this.onAbilityEvent) this.onAbilityEvent(data);
    });

    this.socket.on('event:highfive', (data) => {
      if (this.onHighFiveEvent) this.onHighFiveEvent(data);
    });

    this.socket.on('event:emote', (data) => {
      if (this.onEmoteEvent) this.onEmoteEvent(data);
    });

    this.socket.on('event:checkpoint', (data) => {
      if (this.onCheckpointEvent) this.onCheckpointEvent(data);
    });

    this.socket.on('event:level_complete', () => {
      if (this.onLevelComplete) this.onLevelComplete();
    });

    this.socket.on('event:message', (data) => {
      if (this.onMessage) this.onMessage(data);
    });
  }

  public createRoom(playerName: string, character: CharacterType): Promise<{ success: boolean; room?: RoomState; error?: string }> {
    return new Promise((resolve) => {
      this.socket.emit('room:create', { playerName, character }, (res) => {
        if (res.success && res.room) {
          this.roomState = res.room;
        }
        resolve(res);
      });
    });
  }

  public joinRoom(roomCode: string, playerName: string): Promise<{ success: boolean; room?: RoomState; error?: string }> {
    return new Promise((resolve) => {
      this.socket.emit('room:join', { roomCode, playerName }, (res) => {
        if (res.success && res.room) {
          this.roomState = res.room;
        }
        resolve(res);
      });
    });
  }

  public selectCharacter(character: CharacterType) {
    this.socket.emit('room:select_character', { character });
  }

  public setReady(ready: boolean) {
    this.socket.emit('room:ready', { ready });
  }

  public startGame() {
    this.socket.emit('game:start');
  }

  public sendTransform(transform: TransformState, isGrounded: boolean, isMoving: boolean) {
    this.socket.emit('player:update', { transform, isGrounded, isMoving });
  }

  public sendAbility(abilityType: 'platform' | 'pulse', position: Vector3D) {
    this.socket.emit('player:ability', { abilityType, position });
  }

  public sendInteract(action: 'highfive' | 'switch' | 'lever', targetId?: string) {
    this.socket.emit('player:interact', { action, targetId });
  }

  public sendEmote(emote: EmoteType) {
    this.socket.emit('player:emote', { emote });
  }

  public sendRespawn(checkpointId: number) {
    this.socket.emit('player:respawn', { checkpointId });
  }

  public setCheckpoint(checkpointId: number) {
    this.socket.emit('player:checkpoint', { checkpointId });
  }

  private measurePing() {
    const start = Date.now();
    this.socket.emit('ping', start, () => {
      this.pingMs = Math.round((Date.now() - start) / 2);
      setTimeout(() => this.measurePing(), 5000);
    });
  }
}
