import { describe, expect, it } from 'vitest';
import { emptyGame, put } from './helpers.js';

describe('En passant', () => {
  it('allows capturing a pawn that just double-stepped past an adjacent pawn', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 4, rank: 4 }, 'P', 'w', { hasMoved: true }); // white pawn on its 5th rank
    put(g, { file: 3, rank: 6 }, 'P', 'b'); // black pawn on its start rank
    g.turn = 'b';

    g.applyMove({ kind: 'move', from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, promote: false });

    const epMove = g
      .legalMoves()
      .find((m) => m.kind === 'move' && m.from.file === 4 && m.from.rank === 4 && m.to.file === 3 && m.to.rank === 5);
    expect(epMove).toBeTruthy();

    const applied = g.applyMove(epMove as any);
    expect(applied.captured?.type).toBe('P');
    expect(g.board.get({ file: 3, rank: 4 })).toBeNull(); // captured pawn removed
    expect(g.board.get({ file: 3, rank: 5 })?.color).toBe('w'); // capturer landed on the skipped square
  });

  it('expires if not captured on the very next turn', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 4, rank: 4 }, 'P', 'w', { hasMoved: true });
    put(g, { file: 3, rank: 6 }, 'P', 'b');
    g.turn = 'b';

    g.applyMove({ kind: 'move', from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, promote: false });
    // white plays something else instead of capturing en passant
    g.applyMove({ kind: 'move', from: { file: 4, rank: 0 }, to: { file: 3, rank: 0 }, promote: false });
    // black plays a neutral move
    g.applyMove({ kind: 'move', from: { file: 4, rank: 7 }, to: { file: 3, rank: 7 }, promote: false });

    const epMove = g
      .legalMoves()
      .find((m) => m.kind === 'move' && m.from.file === 4 && m.from.rank === 4 && m.to.file === 3 && m.to.rank === 5);
    expect(epMove).toBeFalsy();
  });

  it('does not apply if the pawn arrived via two single-step moves instead of one double-step', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 4, rank: 4 }, 'P', 'w', { hasMoved: true });
    put(g, { file: 3, rank: 5 }, 'P', 'b', { hasMoved: true });
    g.turn = 'b';

    g.applyMove({ kind: 'move', from: { file: 3, rank: 5 }, to: { file: 3, rank: 4 }, promote: false });

    const epMove = g
      .legalMoves()
      .find((m) => m.kind === 'move' && m.from.file === 4 && m.from.rank === 4 && m.to.file === 3 && m.to.rank === 5);
    expect(epMove).toBeFalsy();
  });
});
