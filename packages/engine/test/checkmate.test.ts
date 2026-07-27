import { describe, expect, it } from 'vitest';
import { emptyGame, put } from './helpers.js';

describe('Checkmate detection', () => {
  it('detects a cornered king with all escape squares and the king itself covered', () => {
    const g = emptyGame();
    put(g, { file: 7, rank: 7 }, 'K', 'b'); // cornered king (h8)
    put(g, { file: 0, rank: 0 }, 'K', 'w');
    put(g, { file: 0, rank: 7 }, 'R', 'w', { hasMoved: true }); // rank 7: checks king, covers (6,7)
    put(g, { file: 6, rank: 0 }, 'R', 'w', { hasMoved: true }); // file 6: covers (6,6)
    put(g, { file: 7, rank: 0 }, 'R', 'w', { hasMoved: true }); // file 7: covers (7,6), also checks
    g.turn = 'b';

    expect(g.isInCheck('b')).toBe(true);
    expect(g.isCheckmate()).toBe(true);
  });

  it('is not checkmate if the king has a legal escape square', () => {
    const g = emptyGame();
    put(g, { file: 7, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'K', 'w');
    put(g, { file: 0, rank: 7 }, 'R', 'w', { hasMoved: true });
    g.turn = 'b';

    expect(g.isInCheck('b')).toBe(true);
    expect(g.isCheckmate()).toBe(false);
  });
});
