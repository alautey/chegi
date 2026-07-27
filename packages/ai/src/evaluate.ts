import { Coord, Game, Piece, PieceType, Color } from '@chegi/engine';

const BASE_VALUE: Record<PieceType, number> = {
  K: 10000,
  Q: 900,
  R: 500,
  B: 500,
  G: 350,
  N: 350,
  P: 100,
};

// Promotion in Chegi turns General/Knight/Pawn into a Gold General, and
// Rook/Bishop into a Dragon — all meaningfully stronger than the base piece.
const PROMOTED_VALUE: Partial<Record<PieceType, number>> = {
  G: 450,
  N: 450,
  P: 450,
  R: 700,
  B: 700,
};

export function pieceValue(piece: Piece): number {
  if (piece.promoted) return PROMOTED_VALUE[piece.type] ?? BASE_VALUE[piece.type];
  return BASE_VALUE[piece.type];
}

/** In-hand pieces are always unpromoted (captured pieces revert), so hand value uses BASE_VALUE. */
export function handPieceValue(type: PieceType): number {
  return BASE_VALUE[type];
}

const CENTER = 3.5;

function centrality(coord: Coord): number {
  return 7 - Math.abs(coord.file - CENTER) - Math.abs(coord.rank - CENTER);
}

/**
 * Static evaluation from the perspective of `color`: positive means `color`
 * is better off. Because captured pieces stay "in play" via drops (unlike
 * chess), material in hand counts at nearly full value rather than being
 * written off — this is the standard Shogi-style evaluation adjustment.
 */
export function evaluate(game: Game, color: Color): number {
  const opponent: Color = color === 'w' ? 'b' : 'w';
  let score = 0;

  for (const { coord, piece } of game.board.allPieces()) {
    const value = pieceValue(piece);
    const sign = piece.color === color ? 1 : -1;
    score += sign * value;

    if (piece.type !== 'K') {
      score += sign * centrality(coord) * 2;
    }
  }

  for (const [type, count] of Object.entries(game.board.hands[color]) as [PieceType, number][]) {
    score += handPieceValue(type) * count;
  }
  for (const [type, count] of Object.entries(game.board.hands[opponent]) as [PieceType, number][]) {
    score -= handPieceValue(type) * count;
  }

  return score;
}
