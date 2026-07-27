import { Board, forwardDir, homeRank } from './board.js';
import { Coord, Piece, coordInBounds } from './types.js';

type Dir = readonly [number, number];

const ORTHO_DIRS: Dir[] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const DIAG_DIRS: Dir[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KING_DIRS: Dir[] = [...ORTHO_DIRS, ...DIAG_DIRS];
const KNIGHT_OFFSETS: Dir[] = [
  [1, 2], [1, -2], [-1, 2], [-1, -2],
  [2, 1], [2, -1], [-2, 1], [-2, -1],
];

function add(c: Coord, d: Dir): Coord {
  return { file: c.file + d[0], rank: c.rank + d[1] };
}

function slide(board: Board, from: Coord, color: Piece['color'], dirs: Dir[]): Coord[] {
  const out: Coord[] = [];
  for (const dir of dirs) {
    let cur = add(from, dir);
    while (coordInBounds(cur)) {
      const occupant = board.get(cur);
      if (!occupant) {
        out.push(cur);
      } else {
        if (occupant.color !== color) out.push(cur);
        break;
      }
      cur = add(cur, dir);
    }
  }
  return out;
}

function step(board: Board, from: Coord, color: Piece['color'], dirs: Dir[]): Coord[] {
  const out: Coord[] = [];
  for (const dir of dirs) {
    const to = add(from, dir);
    if (!coordInBounds(to)) continue;
    const occupant = board.get(to);
    if (!occupant || occupant.color !== color) out.push(to);
  }
  return out;
}

/** Silver General directions (forward + both forward diagonals + both backward diagonals). */
function silverDirs(f: 1 | -1): Dir[] {
  return [[0, f], [-1, f], [1, f], [-1, -f], [1, -f]];
}

/** Gold General directions (forward, both forward diagonals, sideways, straight back). */
function goldDirs(f: 1 | -1): Dir[] {
  return [[0, f], [-1, f], [1, f], [-1, 0], [1, 0], [0, -f]];
}

export interface PseudoMove {
  to: Coord;
  /** For pawns: whether this destination is reached by a quiet step (no capture allowed)
   * or a diagonal capture (capture required — cannot move there if empty). */
  pawnMode?: 'quiet' | 'capture' | 'double';
}

/**
 * Pseudo-legal destinations for a piece: respects board bounds, blocking, and
 * not landing on your own piece. Does NOT check for leaving your own King in
 * check, en passant, or the Knights Templar special rule — those are layered
 * on in game.ts.
 */
export function pieceDestinations(board: Board, from: Coord, piece: Piece): PseudoMove[] {
  const { type, color, promoted } = piece;
  const f = forwardDir(color);

  switch (type) {
    case 'K':
      return step(board, from, color, KING_DIRS).map((to) => ({ to }));

    case 'Q':
      return slide(board, from, color, [...ORTHO_DIRS, ...DIAG_DIRS]).map((to) => ({ to }));

    case 'R': {
      const moves = slide(board, from, color, ORTHO_DIRS).map((to) => ({ to }));
      if (promoted) moves.push(...step(board, from, color, DIAG_DIRS).map((to) => ({ to })));
      return moves;
    }

    case 'B': {
      const moves = slide(board, from, color, DIAG_DIRS).map((to) => ({ to }));
      if (promoted) moves.push(...step(board, from, color, ORTHO_DIRS).map((to) => ({ to })));
      return moves;
    }

    case 'G':
      return step(board, from, color, promoted ? goldDirs(f) : silverDirs(f)).map((to) => ({ to }));

    case 'N': {
      if (promoted) return step(board, from, color, goldDirs(f)).map((to) => ({ to }));
      return step(board, from, color, KNIGHT_OFFSETS).map((to) => ({ to }));
    }

    case 'P': {
      if (promoted) return step(board, from, color, goldDirs(f)).map((to) => ({ to }));
      const out: PseudoMove[] = [];

      const quiet = add(from, [0, f]);
      if (coordInBounds(quiet) && !board.get(quiet)) {
        out.push({ to: quiet, pawnMode: 'quiet' });

        if (!piece.hasMoved && from.rank === homeRank(color) + f) {
          const double = add(from, [0, 2 * f]);
          if (coordInBounds(double) && !board.get(double)) {
            out.push({ to: double, pawnMode: 'double' });
          }
        }
      }

      for (const dx of [-1, 1]) {
        const cap = add(from, [dx, f]);
        if (!coordInBounds(cap)) continue;
        const occupant = board.get(cap);
        if (occupant && occupant.color !== color) out.push({ to: cap, pawnMode: 'capture' });
      }

      return out;
    }
  }
}
