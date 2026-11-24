import { CharacterType, PlayerState, PuzzleState, RoomPlayer, RoomState, TransformState, Vector3D } from './types';

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; character: CharacterType }, callback: (res: { success: boolean; room?: RoomState; error?: string }) => void) => void;
  'room:join': (data: { roomCode: string; playerName: string }, callback: (res: { success: boolean; room?: RoomState; error?: string }) => void) => void;
  'room:select_character': (data: { character: CharacterType }) => void;
  'room:ready': (data: { ready: boolean }) => void;
  'game:start': () => void;
  
  // Gameplay sync
  'player:update': (data: { transform: TransformState; isGrounded: boolean; isMoving: boolean }) => void;
  'player:ability': (data: { abilityType: 'platform' | 'pulse'; position: Vector3D; targetId?: string }) => void;
  'player:interact': (data: { action: 'highfive' | 'switch' | 'lever'; targetId?: string }) => void;
  'player:checkpoint': (data: { checkpointId: number }) => void;
  'player:respawn': (data: { checkpointId: number }) => void;

  // Local/shared ping
  'ping': (timestamp: number, callback: (timestamp: number) => void) => void;
}

export interface ServerToClientEvents {
  'room:updated': (room: RoomState) => void;
  'room:player_joined': (player: RoomPlayer) => void;
  'room:player_left': (playerId: string) => void;
  'game:started': (room: RoomState) => void;

  // Real-time updates
  'state:tick': (data: { players: Record<string, { transform: TransformState; isGrounded: boolean; isMoving: boolean }>; timestamp: number }) => void;
  'puzzle:updated': (puzzleState: PuzzleState) => void;
  'event:ability': (data: { playerId: string; character: CharacterType; abilityType: 'platform' | 'pulse'; position: Vector3D }) => void;
  'event:highfive': (data: { player1Id: string; player2Id: string; position: Vector3D }) => void;
  'event:checkpoint': (data: { checkpointId: number; name: string }) => void;
  'event:level_complete': () => void;
  'event:message': (data: { text: string; kind?: 'info' | 'encouragement' | 'success' }) => void;
}
