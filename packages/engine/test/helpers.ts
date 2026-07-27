import { Board, freshId } from '../src/board.js';
import { Game } from '../src/game.js';
import { Color, Coord, Piece, PieceType } from '../src/types.js';

/** A Game with an empty board — tests place exactly the pieces they need. */
export function emptyGame(): Game {
  const g = new Game();
  g.board = new Board();
  return g;
}

export function put(
  game: Game,
  coord: Coord,
  type: PieceType,
  color: Color,
  opts: { promoted?: boolean; hasMoved?: boolean } = {},
): Piece {
  const piece: Piece = {
    type,
    color,
    promoted: opts.promoted ?? false,
    hasMoved: opts.hasMoved ?? false,
    id: freshId(),
  };
  game.board.set(coord, piece);
  return piece;
}

/** Unique destination squares for the piece at `coord` (deduped — promotion-eligible
 * squares appear twice in legalMoves(), once per promote:true/false variant). */
export function destinationsOf(game: Game, coord: Coord): Coord[] {
  const all = game
    .legalMoves()
    .filter((m) => m.kind === 'move' && m.from.file === coord.file && m.from.rank === coord.rank)
    .map((m) => (m as any).to as Coord);
  const seen = new Set<string>();
  const out: Coord[] = [];
  for (const c of all) {
    const key = `${c.file},${c.rank}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

export function coordsEqualSet(a: Coord[], b: Coord[]): boolean {
  const key = (c: Coord) => `${c.file},${c.rank}`;
  const sa = new Set(a.map(key));
  const sb = new Set(b.map(key));
  if (sa.size !== sb.size) return false;
  for (const k of sa) if (!sb.has(k)) return false;
  return true;
}
