import { describe, expect, it } from 'vitest';
import { emptyGame, put } from './helpers.js';

function setupCapture(knightHasMoved: boolean) {
  const g = emptyGame();
  put(g, { file: 4, rank: 0 }, 'K', 'w');
  put(g, { file: 4, rank: 7 }, 'K', 'b');
  put(g, { file: 0, rank: 0 }, 'B', 'w', { hasMoved: false });
  put(g, { file: 1, rank: 0 }, 'N', 'w', { hasMoved: knightHasMoved });
  put(g, { file: 7, rank: 7 }, 'B', 'b', { hasMoved: false });
  g.turn = 'b';
  g.applyMove({ kind: 'move', from: { file: 7, rank: 7 }, to: { file: 0, rank: 0 }, promote: false });
  return g;
}

describe('Knights Templar (interpretation flagged in rules.ts — confirm with the rules author)', () => {
  it('grants the home Knight a one-time capture of a Bishop that captured from its own starting square', () => {
    const g = setupCapture(false);
    const special = g
      .legalMoves()
      .find((m) => m.kind === 'move' && m.from.file === 1 && m.from.rank === 0 && m.to.file === 0 && m.to.rank === 0);
    expect(special).toBeTruthy();
  });

  it('does not grant the capture if the Knight has already moved', () => {
    const g = setupCapture(true);
    const special = g
      .legalMoves()
      .find((m) => m.kind === 'move' && m.from.file === 1 && m.from.rank === 0 && m.to.file === 0 && m.to.rank === 0);
    expect(special).toBeFalsy();
  });

  it('expires if not used on the immediate next turn', () => {
    const g = setupCapture(false);
    // white makes some other move instead of using the special capture
    g.applyMove({ kind: 'move', from: { file: 4, rank: 0 }, to: { file: 3, rank: 0 }, promote: false });
    // black makes a neutral move
    g.applyMove({ kind: 'move', from: { file: 4, rank: 7 }, to: { file: 3, rank: 7 }, promote: false });
    const special = g
      .legalMoves()
      .find((m) => m.kind === 'move' && m.from.file === 1 && m.from.rank === 0 && m.to.file === 0 && m.to.rank === 0);
    expect(special).toBeFalsy();
  });
});
