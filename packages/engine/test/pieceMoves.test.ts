import { describe, expect, it } from 'vitest';
import { coordsEqualSet, destinationsOf, emptyGame, put } from './helpers.js';

describe('King', () => {
  it('moves one step in any of the 8 directions', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'K', 'w');
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(dests.length).toBe(8);
  });
});

describe('Queen', () => {
  it('slides orthogonally and diagonally without limit', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'Q', 'w');
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    // 4 files + 4 ranks reachable orthogonally (7 each direction combined = 4+3 file, 4+3 rank...)
    // From e5 (file4,rank4): horizontal 7 squares, vertical 7 squares, each diagonal length varies.
    expect(dests.length).toBe(27);
  });
});

describe('Rook', () => {
  it('unpromoted moves only orthogonally', () => {
    const g = emptyGame();
    put(g, { file: 0, rank: 0 }, 'R', 'w');
    const dests = destinationsOf(g, { file: 0, rank: 0 });
    expect(dests.length).toBe(14); // 7 along file + 7 along rank
    expect(dests.every((d) => d.file === 0 || d.rank === 0)).toBe(true);
  });

  it('promoted (Dragon King) adds one-step diagonal moves', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'R', 'w', { promoted: true });
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(dests.length).toBe(14 + 4);
  });
});

describe('Bishop', () => {
  it('unpromoted moves only diagonally', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'B', 'w');
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(dests.every((d) => Math.abs(d.file - 4) === Math.abs(d.rank - 4))).toBe(true);
  });

  it('promoted (Dragon Horse) adds one-step orthogonal moves', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'B', 'w', { promoted: true });
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    const orthoSteps = dests.filter(
      (d) => (Math.abs(d.file - 4) === 1 && d.rank === 4) || (Math.abs(d.rank - 4) === 1 && d.file === 4),
    );
    expect(orthoSteps.length).toBe(4);
  });
});

describe('General (Silver)', () => {
  it('white General moves forward + both forward diagonals + both backward diagonals, not sideways or straight back', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'G', 'w');
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    const expected = [
      { file: 4, rank: 5 }, // forward
      { file: 3, rank: 5 }, // forward-left
      { file: 5, rank: 5 }, // forward-right
      { file: 3, rank: 3 }, // back-left diagonal
      { file: 5, rank: 3 }, // back-right diagonal
    ];
    expect(coordsEqualSet(dests, expected)).toBe(true);
  });
});

describe('Gold General (promoted General/Knight/Pawn)', () => {
  it('white Gold moves forward, both forward diagonals, sideways, straight back — not diagonal back', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'G', 'w', { promoted: true });
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    const expected = [
      { file: 4, rank: 5 },
      { file: 3, rank: 5 },
      { file: 5, rank: 5 },
      { file: 3, rank: 4 },
      { file: 5, rank: 4 },
      { file: 4, rank: 3 },
    ];
    expect(coordsEqualSet(dests, expected)).toBe(true);
  });
});

describe('Knight', () => {
  it('moves in all 8 standard chess-knight L-shapes from the center', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'N', 'w');
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    const expected = [
      { file: 5, rank: 6 }, { file: 3, rank: 6 }, { file: 5, rank: 2 }, { file: 3, rank: 2 },
      { file: 6, rank: 5 }, { file: 6, rank: 3 }, { file: 2, rank: 5 }, { file: 2, rank: 3 },
    ];
    expect(coordsEqualSet(dests, expected)).toBe(true);
  });

  it('promoted Knight moves as Gold', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'N', 'w', { promoted: true });
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(dests.length).toBe(6);
  });
});

describe('Pawn', () => {
  it('moves one step forward, cannot capture straight ahead', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'P', 'w', { hasMoved: true });
    put(g, { file: 4, rank: 5 }, 'P', 'b'); // blocks the forward step (enemy piece straight ahead, not capturable)
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(dests.length).toBe(0);
  });

  it('captures only diagonally', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'P', 'w', { hasMoved: true });
    put(g, { file: 3, rank: 5 }, 'P', 'b');
    put(g, { file: 5, rank: 5 }, 'P', 'b');
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(coordsEqualSet(dests, [{ file: 4, rank: 5 }, { file: 3, rank: 5 }, { file: 5, rank: 5 }])).toBe(true);
  });

  it('can move two squares from its own starting rank', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 1 }, 'P', 'w');
    const dests = destinationsOf(g, { file: 4, rank: 1 });
    expect(coordsEqualSet(dests, [{ file: 4, rank: 2 }, { file: 4, rank: 3 }])).toBe(true);
  });

  it('cannot double-step once it has already moved', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 2 }, 'P', 'w', { hasMoved: true });
    const dests = destinationsOf(g, { file: 4, rank: 2 });
    expect(coordsEqualSet(dests, [{ file: 4, rank: 3 }])).toBe(true);
  });

  it('promoted Pawn moves as Gold', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 4 }, 'P', 'w', { promoted: true });
    const dests = destinationsOf(g, { file: 4, rank: 4 });
    expect(dests.length).toBe(6);
  });
});
