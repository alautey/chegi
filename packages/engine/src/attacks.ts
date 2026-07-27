import { Board, forwardDir } from './board.js';
import { pieceDestinations } from './pieceMoves.js';
import { Coord, Piece, coordInBounds } from './types.js';

/**
 * Squares a piece threatens, for check-detection / king-safety purposes.
 * Differs from pieceDestinations only for the unpromoted Pawn: its two
 * forward-diagonal squares are threatened whether or not they're currently
 * occupied (pieceDestinations only lists them when there's something to
 * capture).
 */
export function squaresAttackedBy(board: Board, from: Coord, piece: Piece): Coord[] {
  if (piece.type === 'P' && !piece.promoted) {
    const f = forwardDir(piece.color);
    const out: Coord[] = [];
    for (const dx of [-1, 1]) {
      const c = { file: from.file + dx, rank: from.rank + f };
      if (coordInBounds(c)) out.push(c);
    }
    return out;
  }
  return pieceDestinations(board, from, piece).map((m) => m.to);
}

export function isSquareAttacked(board: Board, target: Coord, byColor: Piece['color']): boolean {
  for (const { coord, piece } of board.allPieces()) {
    if (piece.color !== byColor) continue;
    const attacks = squaresAttackedBy(board, coord, piece);
    if (attacks.some((c) => c.file === target.file && c.rank === target.rank)) return true;
  }
  return false;
}

export function isInCheck(board: Board, color: Piece['color']): boolean {
  const king = board.findKing(color);
  if (!king) return false;
  const opponent = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, king, opponent);
}
