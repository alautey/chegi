import type { Piece, PieceType } from '@chegi/engine';

export function pieceLabel(piece: Piece): string {
  return piece.promoted ? `+${piece.type}` : piece.type;
}

// Chess glyphs mark the pieces that already look/move like their chess
// counterparts — Rook and Bishop keep theirs even promoted (they still move
// like a rook/bishop, just with an added step), but promoted Knight/Pawn
// become a Gold General (an entirely different move set), so they fall back
// to the lettered notation rather than showing a now-misleading glyph.
const CHESS_GLYPH: Partial<Record<PieceType, string>> = {
  K: '♚',
  Q: '♛',
  R: '♜',
  B: '♝',
  N: '♞',
  P: '♟',
};

export function pieceUsesGlyph(piece: Piece): boolean {
  return (
    piece.type === 'K' ||
    piece.type === 'Q' ||
    piece.type === 'R' ||
    piece.type === 'B' ||
    ((piece.type === 'N' || piece.type === 'P') && !piece.promoted)
  );
}

export function pieceMark(piece: Piece): string {
  if (pieceUsesGlyph(piece)) return CHESS_GLYPH[piece.type]!;
  return pieceLabel(piece);
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
