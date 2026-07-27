import { describe, expect, it } from 'vitest';
import { chooseMove } from '../src/search.js';
import { emptyGame, put } from './helpers.js';

describe('chooseMove', () => {
  it('returns one of the actually-legal moves', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'R', 'w', { hasMoved: true });

    const move = chooseMove(g, { maxDepth: 2, timeBudgetMs: 1000 });
    const legal = g.legalMoves();
    const found = legal.some((m) => JSON.stringify(m) === JSON.stringify(move));
    expect(found).toBe(true);
  });

  it('finds a forced mate over non-mating alternatives (Rook drop)', () => {
    const g = emptyGame();
    put(g, { file: 7, rank: 7 }, 'K', 'b'); // cornered king
    put(g, { file: 0, rank: 0 }, 'K', 'w', { hasMoved: true });
    put(g, { file: 6, rank: 1 }, 'R', 'w', { hasMoved: true }); // covers g6/g7 escape squares
    g.board.addToHand('w', 'R'); // a second Rook to drop for mate

    const move = chooseMove(g, { maxDepth: 2, timeBudgetMs: 2000 });
    g.applyMove(move);
    expect(g.isCheckmate()).toBe(true);
  });

  it('prefers capturing a hanging Queen over a quiet move', () => {
    const g = emptyGame();
    put(g, { file: 4, rank: 0 }, 'K', 'w');
    put(g, { file: 4, rank: 7 }, 'K', 'b');
    put(g, { file: 0, rank: 0 }, 'R', 'w', { hasMoved: true });
    put(g, { file: 0, rank: 5 }, 'Q', 'b', { hasMoved: true }); // undefended, capturable by the rook

    const move = chooseMove(g, { maxDepth: 2, timeBudgetMs: 1000 });
    expect(move.kind).toBe('move');
    if (move.kind === 'move') {
      expect(move.to).toEqual({ file: 0, rank: 5 });
    }
  });
});
