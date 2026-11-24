import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@together-apart/shared';
import { GameRoom } from './GameRoom';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public createRoom(): GameRoom {
    let code: string;
    do {
      code = this.generateRoomCode();
    } while (this.rooms.has(code));

    const room = new GameRoom(code, this.io);
    this.rooms.set(code, room);
    console.log(`[RoomManager] Created room ${code}`);
    return room;
  }

  public getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public removeRoom(code: string) {
    this.rooms.delete(code.toUpperCase());
    console.log(`[RoomManager] Destroyed room ${code}`);
  }

  public findRoomBySocketId(socketId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0, O, 1, I
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
