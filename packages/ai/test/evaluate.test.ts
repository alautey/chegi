import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/evaluate.js';
import { emptyGame, put } from './helpers.js';

describe('evaluate', () => {
  it('is zero for a materially symmetric position', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'R', 'w');
    put(g, { file: 0, rank: 7 }, 'R', 'b');
    expect(evaluate(g, 'w')).toBe(0);
    expect(evaluate(g, 'b')).toBe(0);
  });

  it('favors the side with extra material', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'Q', 'w');
    expect(evaluate(g, 'w')).toBeGreaterThan(0);
    expect(evaluate(g, 'b')).toBeLessThan(0);
  });

  it('counts hand pieces toward material (drops keep captured material "in play")', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    g.board.addToHand('w', 'R');
    expect(evaluate(g, 'w')).toBeGreaterThan(0);
  });
});
