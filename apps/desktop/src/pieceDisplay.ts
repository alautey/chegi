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

// Kanji borrowed from real Shogi where a piece has a direct counterpart
// (King/Rook/Bishop/General/Knight/Pawn); Queen has no Shogi equivalent, so
// it uses 后 ("consort/queen"). Promotion is still shown by turning the mark
// red, same as every other set, rather than swapping to a different kanji.
const KANJI: Record<PieceType, string> = {
  K: '王',
  Q: '后',
  R: '飛',
  B: '角',
  G: '銀',
  N: '桂',
  P: '歩',
};

export type PieceSetId = 'chess' | 'letters' | 'kanji';

export const PIECE_SET_NAMES: Record<PieceSetId, string> = {
  chess: 'Chess',
  letters: 'Notation Letters',
  kanji: 'Shogi Kanji',
};

export type PieceDisplayContent = { icon: 'general' } | { text: string };

/** What to render on a tile's fill layer for the given piece set. */
export function pieceDisplayContent(piece: Piece, setId: PieceSetId): PieceDisplayContent {
  if (setId === 'letters') return { text: pieceLabel(piece) };
  if (setId === 'kanji') return { text: KANJI[piece.type] };
  // 'chess'
  if (piece.type === 'G') return { icon: 'general' };
  return { text: pieceMark(piece) };
}

/** Whether the fill layer should use the larger glyph-sized font for this set/piece. */
export function usesLargeMark(piece: Piece, setId: PieceSetId): boolean {
  if (setId === 'kanji') return true;
  if (setId === 'letters') return false;
  return pieceUsesGlyph(piece);
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
