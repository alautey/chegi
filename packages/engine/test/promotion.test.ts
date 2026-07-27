import { describe, expect, it } from 'vitest';
import { emptyGame, put } from './helpers.js';

describe('Promotion', () => {
  it('is mandatory for a Pawn moving to the last rank (it would have no legal move otherwise)', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 6 }, 'P', 'w', { hasMoved: true });
    const moves = g
      .legalMoves()
      .filter((m) => m.kind === 'move' && m.from.file === 4 && m.from.rank === 6 && m.to.rank === 7);
    expect(moves).toHaveLength(1);
    expect((moves[0] as any).promote).toBe(true);
  });

  it('is optional for a General moving into the last rank (it still has backward-diagonal moves available)', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 6 }, 'G', 'w', { hasMoved: true });
    const moves = g
      .legalMoves()
      .filter((m) => m.kind === 'move' && m.from.file === 4 && m.from.rank === 6 && m.to.file === 4 && m.to.rank === 7);
    expect(moves).toHaveLength(2);
    expect(moves.some((m) => (m as any).promote === true)).toBe(true);
    expect(moves.some((m) => (m as any).promote === false)).toBe(true);
  });

  it('promoting a Rook grants Dragon King diagonal steps', () => {
    const g = emptyGame();
    put(g, { file: 0, rank: 6 }, 'R', 'w', { hasMoved: true });
    const applied = g.applyMove({ kind: 'move', from: { file: 0, rank: 6 }, to: { file: 0, rank: 7 }, promote: true });
    expect(applied.notation).toContain('^');
    const piece = g.board.get({ file: 0, rank: 7 })!;
    expect(piece.promoted).toBe(true);
  });

  it('a captured promoted piece reverts to unpromoted when it re-enters the hand', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'R', 'w', { promoted: true, hasMoved: true });
    put(g, { file: 0, rank: 1 }, 'P', 'b', { hasMoved: true }); // capturable by the promoted Rook
    const applied = g.applyMove({ kind: 'move', from: { file: 0, rank: 0 }, to: { file: 0, rank: 1 }, promote: false });
    expect(applied.captured?.type).toBe('P');
    expect(g.board.hands.w.P).toBe(1);
  });
});
