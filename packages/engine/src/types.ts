export type Color = 'w' | 'b';

// Pieces that can be dropped from hand. King is excluded — capturing it ends
// the game before it could ever be dropped.
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'G' | 'N' | 'P';

// Types that are ever eligible for promotion (rules: "apart from the King
// and the Queen all pieces can promote").
export type PromotablePieceType = 'R' | 'B' | 'G' | 'N' | 'P';

export function isPromotable(type: PieceType): type is PromotablePieceType {
  return type === 'R' || type === 'B' || type === 'G' || type === 'N' || type === 'P';
}

export interface Piece {
  type: PieceType;
  color: Color;
  promoted: boolean;
  /** True until this exact piece instance makes its first move. Used only by
   * the Knights Templar special rule and (for the Bishop) tracked to know
   * whether a capture originated from the home square. */
  hasMoved: boolean;
  /** Stable id so we can track "this exact piece" across moves (needed for
   * Knights Templar and hasMoved semantics after captures/drops). */
  id: number;
}

export interface Coord {
  file: number; // 0=a .. 7=h
  rank: number; // 0=white's home rank .. 7=black's home rank
}

export function coordEquals(a: Coord, b: Coord): boolean {
  return a.file === b.file && a.rank === b.rank;
}

export function coordInBounds(c: Coord): boolean {
  return c.file >= 0 && c.file <= 7 && c.rank >= 0 && c.rank <= 7;
}

export function coordKey(c: Coord): number {
  return c.rank * 8 + c.file;
}

export function keyToCoord(key: number): Coord {
  return { file: key % 8, rank: Math.floor(key / 8) };
}

export type MoveKind = 'move' | 'drop';

export interface BoardMove {
  kind: 'move';
  from: Coord;
  to: Coord;
  /** Set when the moved piece is eligible to promote and the player chose to. */
  promote: boolean;
}

export interface DropMove {
  kind: 'drop';
  pieceType: PromotablePieceType | 'Q';
  to: Coord;
}

export type Move = BoardMove | DropMove;

export interface AppliedMove {
  move: Move;
  color: Color;
  captured: Piece | null;
  /** Algebraic-ish notation string per the spec's notation table. */
  notation: string;
  check: boolean;
  checkmate: boolean;
}
