import type { Color, Piece } from '@chegi/engine';

// Standard chess silhouettes for the pieces that already look/move like their
// chess counterparts.
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

interface GeneralProps {
  color: Color;
  promoted?: boolean;
}

/** A peaked/service cap with a star, standing in for the General (a rank, not a chess piece). */
export function GeneralGlyph({ color, promoted }: GeneralProps) {
  return (
    <span className={`piece-glyph piece-glyph-${color}`}>
      <svg viewBox="0 0 64 64" width="40" height="40" className="cap-icon">
        <path className="cap-body" d="M10 40 Q32 51 54 40 L54 45 Q32 56 10 45 Z" />
        <rect className="cap-body" x="12" y="31" width="40" height="10" rx="2.5" />
        <path className="cap-body" d="M13 32 Q13 7 32 7 Q51 7 51 32 Z" />
        <circle className="cap-star" cx="32" cy="8.5" r="2.3" />
        <polygon
          className="cap-star"
          points="32,29.5 33.5,33.2 37.5,33.5 34.4,36 35.5,39.9 32,37.7 28.5,39.9 29.6,36 26.5,33.5 30.5,33.2"
        />
      </svg>
      {promoted && <span className="promo-badge">+</span>}
    </span>
  );
}
