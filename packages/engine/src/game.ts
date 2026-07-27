import { Board, forwardDir, freshId } from './board.js';
import { isInCheck } from './attacks.js';
import { pieceDestinations } from './pieceMoves.js';
import {
  checkDropLegality,
  computeTemplarGrant,
  isPromotionMandatory,
  moveTouchesPromotionZone,
  TemplarWindow,
  templarKnightHomeSquare,
} from './rules.js';
import {
  AppliedMove,
  BoardMove,
  Color,
  Coord,
  DropMove,
  Move,
  Piece,
  PieceType,
  PromotablePieceType,
  coordEquals,
  isPromotable,
} from './types.js';

interface EnPassantState {
  /** The square skipped over — this is where the capturing pawn lands. */
  target: Coord;
  /** Square the vulnerable pawn actually sits on — this is what gets removed. */
  capturedSquare: Coord;
  /** Color of the pawn that double-stepped (the potential victim). */
  color: Color;
  validAtPly: number;
}

function squareName(c: Coord): string {
  return `${'abcdefgh'[c.file]}${c.rank + 1}`;
}

function pieceLetter(piece: Piece): string {
  return piece.promoted ? `+${piece.type}` : piece.type;
}

export class Game {
  board: Board;
  turn: Color;
  history: AppliedMove[];
  ply: number;
  enPassant: EnPassantState | null;
  templarWindow: TemplarWindow | null;

  constructor() {
    this.board = Board.initial();
    this.turn = 'w';
    this.history = [];
    this.ply = 0;
    this.enPassant = null;
    this.templarWindow = null;
  }

  clone(): Game {
    const g = new Game();
    g.board = this.board.clone();
    g.turn = this.turn;
    g.history = this.history.slice();
    g.ply = this.ply;
    g.enPassant = this.enPassant ? { ...this.enPassant } : null;
    g.templarWindow = this.templarWindow ? { ...this.templarWindow } : null;
    return g;
  }

  private expireWindows(): void {
    if (this.enPassant && this.enPassant.validAtPly !== this.ply) this.enPassant = null;
    if (this.templarWindow && this.templarWindow.validAtPly !== this.ply) this.templarWindow = null;
  }

  private pushWithPromotionBranch(out: BoardMove[], from: Coord, to: Coord, piece: Piece): void {
    const eligible = isPromotable(piece.type) && !piece.promoted && moveTouchesPromotionZone(piece.color, from, to);
    if (!eligible) {
      out.push({ kind: 'move', from, to, promote: false });
      return;
    }
    const mandatory = isPromotionMandatory(this.board, to, piece.type, piece.color);
    out.push({ kind: 'move', from, to, promote: true });
    if (!mandatory) out.push({ kind: 'move', from, to, promote: false });
  }

  private pseudoLegalBoardMoves(color: Color): BoardMove[] {
    const out: BoardMove[] = [];
    for (const { coord, piece } of this.board.allPieces()) {
      if (piece.color !== color) continue;

      for (const d of pieceDestinations(this.board, coord, piece)) {
        this.pushWithPromotionBranch(out, coord, d.to, piece);
      }

      if (
        piece.type === 'P' &&
        !piece.promoted &&
        this.enPassant &&
        this.enPassant.validAtPly === this.ply &&
        this.enPassant.color !== color
      ) {
        const f = forwardDir(color);
        const target = this.enPassant.target;
        if (coord.rank + f === target.rank && Math.abs(coord.file - target.file) === 1) {
          this.pushWithPromotionBranch(out, coord, target, piece);
        }
      }

      if (
        piece.type === 'N' &&
        !piece.promoted &&
        !piece.hasMoved &&
        this.templarWindow &&
        this.templarWindow.forColor === color &&
        this.templarWindow.validAtPly === this.ply &&
        coordEquals(coord, templarKnightHomeSquare(color))
      ) {
        this.pushWithPromotionBranch(out, coord, this.templarWindow.target, piece);
      }
    }
    return out;
  }

  private pseudoLegalDropMoves(color: Color): DropMove[] {
    const out: DropMove[] = [];
    const hand = this.board.hands[color];
    for (const key of Object.keys(hand) as PieceType[]) {
      const count = hand[key] ?? 0;
      if (count <= 0) continue;
      const pieceType = key as PromotablePieceType | 'Q';
      for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
          const to = { file, rank };
          if (checkDropLegality(this.board, color, pieceType, to).legal) {
            out.push({ kind: 'drop', pieceType, to });
          }
        }
      }
    }
    return out;
  }

  /** Applies a move to THIS game's live state without any legality checking. Internal use only (real application happens via applyMove; legality testing clones first). */
  private forceApplyMove(move: Move): { captured: Piece | null; isEnPassant: boolean } {
    const color = this.turn;
    let captured: Piece | null = null;
    let isEnPassant = false;

    if (move.kind === 'drop') {
      this.board.removeFromHand(color, move.pieceType);
      const piece: Piece = {
        type: move.pieceType,
        color,
        promoted: false,
        hasMoved: false,
        id: freshId(),
      };
      this.board.set(move.to, piece);
    } else {
      const piece = this.board.get(move.from);
      if (!piece) throw new Error(`no piece at ${squareName(move.from)}`);

      if (
        piece.type === 'P' &&
        !piece.promoted &&
        this.enPassant &&
        this.enPassant.validAtPly === this.ply &&
        this.enPassant.color !== color &&
        coordEquals(move.to, this.enPassant.target)
      ) {
        isEnPassant = true;
        captured = this.board.get(this.enPassant.capturedSquare);
        this.board.set(this.enPassant.capturedSquare, null);
      } else {
        captured = this.board.get(move.to);
      }

      if (captured) this.board.addToHand(color, captured.type);

      this.board.set(move.from, null);
      const movedPiece: Piece = {
        ...piece,
        hasMoved: true,
        promoted: move.promote ? true : piece.promoted,
      };
      this.board.set(move.to, movedPiece);

      const grant = computeTemplarGrant(color, move.from, move.to, piece, captured, this.ply + 1);
      if (grant) this.templarWindow = grant;

      if (piece.type === 'P' && !piece.promoted && !isEnPassant && Math.abs(move.to.rank - move.from.rank) === 2) {
        const f = forwardDir(color);
        this.enPassant = {
          target: { file: move.from.file, rank: move.from.rank + f },
          capturedSquare: move.to,
          color,
          validAtPly: this.ply + 1,
        };
      }
    }

    this.turn = color === 'w' ? 'b' : 'w';
    this.ply += 1;
    return { captured, isEnPassant };
  }

  legalMoves(): Move[] {
    this.expireWindows();
    const color = this.turn;
    const candidates: Move[] = [...this.pseudoLegalBoardMoves(color), ...this.pseudoLegalDropMoves(color)];
    const legal: Move[] = [];

    for (const move of candidates) {
      const clone = this.clone();
      clone.forceApplyMove(move);
      if (isInCheck(clone.board, color)) continue;

      if (move.kind === 'drop' && move.pieceType === 'P') {
        const opponent = color === 'w' ? 'b' : 'w';
        if (isInCheck(clone.board, opponent) && clone.legalMoves().length === 0) continue;
      }

      legal.push(move);
    }

    return legal;
  }

  isInCheck(color: Color = this.turn): boolean {
    return isInCheck(this.board, color);
  }

  isCheckmate(): boolean {
    return this.isInCheck(this.turn) && this.legalMoves().length === 0;
  }

  /** No legal moves but not in check. Not a win condition per the rules (the only stated goal is capturing the King), but useful for the UI to flag a stuck position. */
  isStalemate(): boolean {
    return !this.isInCheck(this.turn) && this.legalMoves().length === 0;
  }

  applyMove(move: Move): AppliedMove {
    const legal = this.legalMoves();
    const match = legal.find((m) => movesEqual(m, move));
    if (!match) throw new Error('illegal move');

    const color = this.turn;
    const piece = move.kind === 'move' ? this.board.get(move.from) : null;
    const declined =
      move.kind === 'move' &&
      !!piece &&
      isPromotable(piece.type) &&
      !piece.promoted &&
      moveTouchesPromotionZone(color, move.from, move.to) &&
      !move.promote;

    const { captured } = this.forceApplyMove(match);

    const check = this.isInCheck(this.turn);
    const checkmate = check && this.legalMoves().length === 0;

    let notation: string;
    if (match.kind === 'drop') {
      notation = `${match.pieceType}*${squareName(match.to)}`;
    } else {
      const letter = pieceLetter(piece!);
      const capMark = captured ? 'x' : '';
      notation = `${letter}${squareName(match.from)}${capMark}${squareName(match.to)}`;
      if (match.promote) notation += '^';
      else if (declined) notation += '=';
    }
    if (checkmate) notation += '#';
    else if (check) notation += '+';

    const applied: AppliedMove = { move: match, color, captured, notation, check, checkmate };
    this.history.push(applied);
    return applied;
  }
}

function movesEqual(a: Move, b: Move): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'drop' && b.kind === 'drop') {
    return a.pieceType === b.pieceType && coordEquals(a.to, b.to);
  }
  if (a.kind === 'move' && b.kind === 'move') {
    return coordEquals(a.from, b.from) && coordEquals(a.to, b.to) && a.promote === b.promote;
  }
  return false;
}
