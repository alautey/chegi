import type { Color, Piece } from '@chegi/engine';

// Standard chess silhouettes for the pieces that already look/move like their
// chess counterparts. The General (and its Gold-promoted relatives N/P) fall
// back to a plain lettered tile until it has its own design.
const CHESS_GLYPH = {
  K: '♚',
  Q: '♛',
  R: '♜',
  B: '♝',
  N: '♞',
  P: '♟',
} as const;

type GlyphType = keyof typeof CHESS_GLYPH;

export function hasChessGlyph(piece: Piece): boolean {
  if (piece.type === 'K' || piece.type === 'Q' || piece.type === 'R' || piece.type === 'B') return true;
  if (piece.type === 'N' || piece.type === 'P') return !piece.promoted;
  return false;
}

interface Props {
  type: GlyphType;
  color: Color;
  promoted?: boolean;
}

export function PieceGlyph({ type, color, promoted }: Props) {
  return (
    <span className={`piece-glyph piece-glyph-${color}`}>
      {CHESS_GLYPH[type]}
      {promoted && <span className="promo-badge">+</span>}
    </span>
  );
}
