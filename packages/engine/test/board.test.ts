import { describe, expect, it } from 'vitest';
import { Board } from '../src/board.js';

describe('Initial board setup', () => {
  it('places 16 pieces per side and mirrors the back ranks', () => {
    const board = Board.initial();
    let whiteCount = 0;
    let blackCount = 0;
    for (const { piece } of board.allPieces()) {
      if (piece.color === 'w') whiteCount++;
      else blackCount++;
    }
    expect(whiteCount).toBe(16);
    expect(blackCount).toBe(16);

    expect(board.get({ file: 0, rank: 0 })?.type).toBe('B'); // white bishop corner
    expect(board.get({ file: 7, rank: 0 })?.type).toBe('R'); // white rook corner
    expect(board.get({ file: 0, rank: 7 })?.type).toBe('R'); // black rook corner
    expect(board.get({ file: 7, rank: 7 })?.type).toBe('B'); // black bishop corner
    expect(board.get({ file: 4, rank: 0 })?.type).toBe('K');
    expect(board.get({ file: 4, rank: 7 })?.type).toBe('K');
  });
});
