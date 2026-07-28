import { describe, expect, it } from 'vitest';
import { RoomManager } from '../src/rooms.js';

describe('RoomManager', () => {
  it('creates a room and seats the creator as white', () => {
    const rm = new RoomManager();
    const { room, color } = rm.createRoom();
    expect(color).toBe('w');
    expect(room.seated.w).toBe(true);
    expect(room.seated.b).toBe(false);
    expect(room.id).toMatch(/^[A-Z0-9]{5}$/);
  });

  it('lets a second player join as black', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom();
    const result = rm.joinRoom(room.id);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.color).toBe('b');
  });

  it('rejects joining a full room', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom();
    rm.joinRoom(room.id);
    const second = rm.joinRoom(room.id);
    expect(second.ok).toBe(false);
  });

  it('rejects joining a nonexistent room', () => {
    const rm = new RoomManager();
    const result = rm.joinRoom('ZZZZZ');
    expect(result.ok).toBe(false);
  });

  it('applies a legal move for the player whose turn it is', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom();
    rm.joinRoom(room.id);

    const result = rm.applyMove(room.id, 'w', {
      kind: 'move',
      from: { file: 4, rank: 1 },
      to: { file: 4, rank: 3 },
      promote: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.applied.notation).toContain('e4');
  });

  it('rejects a move made out of turn', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom();
    rm.joinRoom(room.id);

    const result = rm.applyMove(room.id, 'b', {
      kind: 'move',
      from: { file: 4, rank: 6 },
      to: { file: 4, rank: 4 },
      promote: false,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects moves after the game has ended', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom();
    rm.joinRoom(room.id);

    rm.endGame(room.id);
    const result = rm.applyMove(room.id, 'w', {
      kind: 'move',
      from: { file: 4, rank: 1 },
      to: { file: 4, rank: 3 },
      promote: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Game is over');
  });

  it('rejects an illegal move', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom();
    rm.joinRoom(room.id);

    // Rook can't jump over its own pawns from the starting position.
    const result = rm.applyMove(room.id, 'w', {
      kind: 'move',
      from: { file: 7, rank: 0 },
      to: { file: 7, rank: 4 },
      promote: false,
    });
    expect(result.ok).toBe(false);
  });
});
