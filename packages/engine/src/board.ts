import { Color, Coord, Piece, PieceType, coordInBounds, coordKey } from './types.js';

let nextPieceId = 1;
export function freshId(): number {
  return nextPieceId++;
}

export type Hand = Partial<Record<PieceType, number>>;

export class Board {
  squares: (Piece | null)[];
  hands: Record<Color, Hand>;

  constructor() {
    this.squares = new Array(64).fill(null);
    this.hands = { w: {}, b: {} };
  }

  static initial(): Board {
    const board = new Board();
    const backRankWhite: PieceType[] = ['B', 'N', 'G', 'Q', 'K', 'G', 'N', 'R'];
    const backRankBlack: PieceType[] = ['R', 'N', 'G', 'Q', 'K', 'G', 'N', 'B'];

    for (let file = 0; file < 8; file++) {
      board.set({ file, rank: 0 }, { type: backRankWhite[file], color: 'w', promoted: false, hasMoved: false, id: freshId() });
      board.set({ file, rank: 1 }, { type: 'P', color: 'w', promoted: false, hasMoved: false, id: freshId() });
      board.set({ file, rank: 6 }, { type: 'P', color: 'b', promoted: false, hasMoved: false, id: freshId() });
      board.set({ file, rank: 7 }, { type: backRankBlack[file], color: 'b', promoted: false, hasMoved: false, id: freshId() });
    }
    return board;
  }

  get(c: Coord): Piece | null {
    if (!coordInBounds(c)) return null;
    return this.squares[coordKey(c)];
  }

  set(c: Coord, piece: Piece | null): void {
    this.squares[coordKey(c)] = piece;
  }

  clone(): Board {
    const b = new Board();
    b.squares = this.squares.slice();
    b.hands = { w: { ...this.hands.w }, b: { ...this.hands.b } };
    return b;
  }

  findKing(color: Color): Coord | null {
    for (let i = 0; i < 64; i++) {
      const p = this.squares[i];
      if (p && p.color === color && p.type === 'K') {
        return { file: i % 8, rank: Math.floor(i / 8) };
      }
    }
    return null;
  }

  *allPieces(): IterableIterator<{ coord: Coord; piece: Piece }> {
    for (let i = 0; i < 64; i++) {
      const p = this.squares[i];
      if (p) yield { coord: { file: i % 8, rank: Math.floor(i / 8) }, piece: p };
    }
  }

  addToHand(color: Color, type: PieceType): void {
    this.hands[color][type] = (this.hands[color][type] ?? 0) + 1;
  }

  removeFromHand(color: Color, type: PieceType): boolean {
    const count = this.hands[color][type] ?? 0;
    if (count <= 0) return false;
    if (count === 1) delete this.hands[color][type];
    else this.hands[color][type] = count - 1;
    return true;
  }
}

/** Home rank (0 for white, 7 for black) — used for Knights Templar and setup. */
export function homeRank(color: Color): number {
  return color === 'w' ? 0 : 7;
}

/** The single-row promotion zone: the rank furthest from the player. */
export function promotionRank(color: Color): number {
  return color === 'w' ? 7 : 0;
}

/** Forward direction in rank-delta terms for a color. */
export function forwardDir(color: Color): 1 | -1 {
  return color === 'w' ? 1 : -1;
}
