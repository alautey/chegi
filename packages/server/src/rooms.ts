import type { AppliedMove, Color, Move } from '@chegi/engine';
import { Game } from '@chegi/engine';

const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easier to read aloud

function generateRoomId(length = 5): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)];
  }
  return id;
}

export interface Room {
  id: string;
  game: Game;
  /** Whether a player has claimed each color — used for seat assignment, independent of live socket state. */
  seated: { w: boolean; b: boolean };
}

export type JoinResult = { ok: true; room: Room; color: Color } | { ok: false; error: string };
export type MoveResult = { ok: true; room: Room; applied: AppliedMove } | { ok: false; error: string };

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(): { room: Room; color: Color } {
    let id = generateRoomId();
    while (this.rooms.has(id)) id = generateRoomId();

    const room: Room = { id, game: new Game(), seated: { w: true, b: false } };
    this.rooms.set(id, room);
    return { room, color: 'w' };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string): JoinResult {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: `No game with code ${roomId}` };
    if (room.seated.b) return { ok: false, error: `Game ${roomId} already has two players` };

    room.seated.b = true;
    return { ok: true, room, color: 'b' };
  }

  applyMove(roomId: string, color: Color, move: Move): MoveResult {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: `No game with code ${roomId}` };
    if (room.game.turn !== color) return { ok: false, error: 'Not your turn' };

    try {
      const applied = room.game.applyMove(move);
      return { ok: true, room, applied };
    } catch {
      return { ok: false, error: 'Illegal move' };
    }
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }
}
