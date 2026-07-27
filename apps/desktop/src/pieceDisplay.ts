import type { Piece, PieceType } from '@chegi/engine';

export function pieceLabel(piece: Piece): string {
  return piece.promoted ? `+${piece.type}` : piece.type;
}

export const PIECE_NAMES: Record<PieceType, string> = {
  K: 'King',
  Q: 'Queen',
  R: 'Rook',
  B: 'Bishop',
  G: 'General',
  N: 'Knight',
  P: 'Pawn',
};
