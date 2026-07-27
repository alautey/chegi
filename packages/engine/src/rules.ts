import { Board, homeRank, promotionRank } from './board.js';
import { pieceDestinations } from './pieceMoves.js';
import { Coord, Piece, PieceType, PromotablePieceType, coordEquals, isPromotable } from './types.js';

/**
 * ASSUMPTION (flagged for confirmation): the spec's pawn-drop file
 * restriction is generalized here to also cover the two diagonals through
 * the drop square, not just the file. Standard Shogi only restricts by file
 * ("nifu"). Set this to false to fall back to file-only if that turns out
 * to be the intended reading.
 */
export const PAWN_DROP_RESTRICTION_INCLUDES_DIAGONALS = true;

export function isInPromotionZone(color: Piece['color'], rank: number): boolean {
  return rank === promotionRank(color);
}

/** True if moving from `from` to `to` touches the promotion zone at all (enters, exits, or stays within — the zone is a single row, so "within" only matters for horizontal-only movers, which don't exist here, but included for completeness). */
export function moveTouchesPromotionZone(color: Piece['color'], from: Coord, to: Coord): boolean {
  return isInPromotionZone(color, from.rank) || isInPromotionZone(color, to.rank);
}

/** Would this (type, promoted, color) piece have at least one legal destination if it were sitting at `at`? Used both for forced-promotion and for the drop "must have a legal move" rule. */
export function hasAnyDestinationFrom(
  board: Board,
  at: Coord,
  type: PieceType,
  color: Piece['color'],
  promoted: boolean,
): boolean {
  const probe: Piece = { type, color, promoted, hasMoved: true, id: -1 };
  const clone = board.clone();
  const existing = clone.get(at);
  clone.set(at, probe);
  const dests = pieceDestinations(clone, at, probe);
  clone.set(at, existing);
  return dests.length > 0;
}

/** Per the rules: promotion is optional unless declining would leave the piece with zero legal moves — in which case it's mandatory. */
export function isPromotionMandatory(
  board: Board,
  at: Coord,
  type: PieceType,
  color: Piece['color'],
): boolean {
  if (!isPromotable(type)) return false;
  return !hasAnyDestinationFrom(board, at, type, color, false);
}

function pawnsOnFile(board: Board, color: Piece['color'], file: number): boolean {
  for (let rank = 0; rank < 8; rank++) {
    const p = board.get({ file, rank });
    if (p && p.color === color && p.type === 'P' && !p.promoted) return true;
  }
  return false;
}

function pawnsOnDiagonalsThrough(board: Board, color: Piece['color'], target: Coord): boolean {
  const dirs: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [df, dr] of dirs) {
    let f = target.file + df;
    let r = target.rank + dr;
    while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
      const p = board.get({ file: f, rank: r });
      if (p && p.color === color && p.type === 'P' && !p.promoted) return true;
      f += df;
      r += dr;
    }
  }
  return false;
}

export interface DropCheck {
  legal: boolean;
  reason?: string;
}

/**
 * Checks the three drop restrictions from the rules (excluding the pawn
 * uchifuzume/checkmate restriction, which needs full move-legality context
 * and is handled in game.ts):
 *  1. The dropped piece must have a legal move available afterward.
 *  2. (Pawn only) no two unpromoted pawns of the same player on one file
 *     (extended to diagonals per the flag above).
 */
export function checkDropLegality(
  board: Board,
  color: Piece['color'],
  pieceType: PromotablePieceType | 'Q',
  to: Coord,
): DropCheck {
  if (board.get(to)) return { legal: false, reason: 'square occupied' };

  if (pieceType === 'P') {
    if (pawnsOnFile(board, color, to.file)) {
      return { legal: false, reason: 'nifu: unpromoted pawn already on this file' };
    }
    if (PAWN_DROP_RESTRICTION_INCLUDES_DIAGONALS && pawnsOnDiagonalsThrough(board, color, to)) {
      return { legal: false, reason: 'unpromoted pawn already on this diagonal' };
    }
  }

  if (pieceType !== 'Q' && !hasAnyDestinationFrom(board, to, pieceType, color, false)) {
    return { legal: false, reason: 'dropped piece would have no legal move' };
  }

  return { legal: true };
}

// --- Knights Templar -------------------------------------------------------
//
// ASSUMPTION (flagged for confirmation): "If the Bishop is captured by an
// opponent's Bishop from the starting position, on the following turn the
// Knight can capture the Bishop only if the Knight hasn't moved" is
// interpreted here as: if a player's Bishop captures an enemy Bishop while
// moving directly off its own home square (i.e. the capturing Bishop's very
// first move), then on the victim's very next turn, the victim's Knight that
// started next to their Bishop's home corner may make a one-time special
// capture of the Bishop now sitting on the capture square — but only if that
// Knight has not yet moved from its own home square. This bypasses normal
// Knight geometry (it wouldn't otherwise be reachable) and expires if not
// used immediately.

export function bishopHomeSquare(color: Piece['color']): Coord {
  return color === 'w' ? { file: 0, rank: 0 } : { file: 7, rank: 7 };
}

export function templarKnightHomeSquare(color: Piece['color']): Coord {
  return color === 'w' ? { file: 1, rank: 0 } : { file: 6, rank: 7 };
}

export interface TemplarWindow {
  /** The color whose Knight is granted the special capture. */
  forColor: Piece['color'];
  /** Square the enemy Bishop now sits on (capturable target). */
  target: Coord;
  /** Ply value during which this grant is usable — that player's immediate next turn only. */
  validAtPly: number;
}

export function computeTemplarGrant(
  moverColor: Piece['color'],
  moveFrom: Coord,
  moveTo: Coord,
  movedPiece: Piece,
  captured: Piece | null,
  plyAfterMove: number,
): TemplarWindow | null {
  if (movedPiece.type !== 'B' || captured?.type !== 'B') return null;
  if (!coordEquals(moveFrom, bishopHomeSquare(moverColor))) return null;
  const victim = moverColor === 'w' ? 'b' : 'w';
  return { forColor: victim, target: moveTo, validAtPly: plyAfterMove };
}
