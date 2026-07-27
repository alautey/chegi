import { describe, expect, it } from 'vitest';
import { emptyGame, put } from './helpers.js';

function dropMoves(g: ReturnType<typeof emptyGame>, pieceType: string) {
  return g.legalMoves().filter((m) => m.kind === 'drop' && m.pieceType === pieceType);
}

describe('Drops — nifu (two pawns one file)', () => {
  it('cannot drop a pawn on a file that already has an unpromoted pawn of the same color', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'P', 'w', { hasMoved: true });
    g.board.addToHand('w', 'P');
    const drops = dropMoves(g, 'P');
    expect(drops.some((m: any) => m.to.file === 4)).toBe(false);
    expect(drops.some((m: any) => m.to.file === 3)).toBe(true);
  });

  it('a promoted pawn on a file does not block a drop there', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'P', 'w', { promoted: true, hasMoved: true });
    g.board.addToHand('w', 'P');
    const drops = dropMoves(g, 'P');
    expect(drops.some((m: any) => m.to.file === 4 && m.to.rank !== 4)).toBe(true);
  });
});

describe('Drops — diagonal pawn restriction (assumption, see rules.ts)', () => {
  it('cannot drop a pawn onto a diagonal that already has an unpromoted pawn of the same color', () => {
    const g = emptyGame();
    put(g, { file: 2, rank: 2 }, 'P', 'w', { hasMoved: true });
    g.board.addToHand('w', 'P');
    const drops = dropMoves(g, 'P');
    // (4,4) shares a diagonal with (2,2)
    expect(drops.some((m: any) => m.to.file === 4 && m.to.rank === 4)).toBe(false);
  });
});

describe('Drops — must have a legal move afterward', () => {
  it('cannot drop a white pawn on the last rank (it could never move)', () => {
    const g = emptyGame();
    g.board.addToHand('w', 'P');
    const drops = dropMoves(g, 'P');
    expect(drops.some((m: any) => m.to.rank === 7)).toBe(false);
    expect(drops.some((m: any) => m.to.rank === 6)).toBe(true);
  });
});

describe('Drops — uchifuzume (no checkmate by pawn drop)', () => {
  it('forbids a pawn drop that would checkmate the king', () => {
    const g = emptyGame();
    put(g, { file: 7, rank: 7 }, 'K', 'b'); // black king cornered at h8
    put(g, { file: 0, rank: 0 }, 'K', 'w');
    put(g, { file: 7, rank: 0 }, 'R', 'w', { hasMoved: true }); // covers file h (h6/h7 escape)
    put(g, { file: 0, rank: 7 }, 'R', 'w', { hasMoved: true }); // covers rank 8 (g8 escape)
    put(g, { file: 4, rank: 5 }, 'N', 'w', { hasMoved: true }); // defends g7 so king can't capture the drop
    g.board.addToHand('w', 'P');

    const drops = dropMoves(g, 'P');
    expect(drops.some((m: any) => m.to.file === 6 && m.to.rank === 6)).toBe(false);
  });

  it('allows the same pawn drop delivering check (not mate) once the defender is removed', () => {
    const g = emptyGame();
    put(g, { file: 7, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'K', 'w');
    put(g, { file: 7, rank: 0 }, 'R', 'w', { hasMoved: true });
    put(g, { file: 0, rank: 7 }, 'R', 'w', { hasMoved: true });
    // no knight defending g7 this time — king can capture the checking pawn
    g.board.addToHand('w', 'P');

    const drops = dropMoves(g, 'P');
    expect(drops.some((m: any) => m.to.file === 6 && m.to.rank === 6)).toBe(true);
  });
});
