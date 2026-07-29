import type { Color, Coord, Piece, PieceType } from '@chegi/engine';
import { Board, Game, pieceDestinations } from '@chegi/engine';

export interface Demo {
  game: Game;
  /** The piece the demo is about — gets the "selected" outline. */
  highlight: Coord | null;
  targets: Coord[];
  checkSquare?: Coord | null;
  checkmate?: boolean;
}

function emptyGame(): Game {
  const g = new Game();
  g.board = new Board();
  return g;
}

function place(
  game: Game,
  coord: Coord,
  type: PieceType,
  color: Color,
  opts: { promoted?: boolean; hasMoved?: boolean } = {},
): Piece {
  const piece: Piece = { type, color, promoted: opts.promoted ?? false, hasMoved: opts.hasMoved ?? true, id: 0 };
  game.board.set(coord, piece);
  return piece;
}

const CENTER: Coord = { file: 4, rank: 3 };

/** A plain movement demo: one piece on an otherwise empty board, every reachable square lit up. */
function movementDemo(type: PieceType, color: Color = 'w', promoted = false): Demo {
  const game = emptyGame();
  const piece = place(game, CENTER, type, color, { promoted });
  const targets = pieceDestinations(game.board, CENTER, piece).map((m) => m.to);
  return { game, highlight: CENTER, targets };
}

export function kingDemo(): Demo {
  return movementDemo('K');
}

export function queenDemo(): Demo {
  return movementDemo('Q');
}

export function rookDemo(): Demo {
  return movementDemo('R');
}

export function bishopDemo(): Demo {
  return movementDemo('B');
}

export function generalDemo(): Demo {
  return movementDemo('G');
}

export function knightDemo(): Demo {
  return movementDemo('N');
}

/** Pawn on an empty board: shows the plain forward step + the (unavailable) double step is omitted — see pawnDoubleStepDemo. */
export function pawnDemo(): Demo {
  const game = emptyGame();
  const from: Coord = { file: 4, rank: 4 };
  const piece = place(game, from, 'P', 'w', { hasMoved: true });
  place(game, { file: 3, rank: 5 }, 'P', 'b'); // capturable, diagonally forward-left
  place(game, { file: 5, rank: 5 }, 'P', 'b'); // capturable, diagonally forward-right
  const targets = pieceDestinations(game.board, from, piece).map((m) => m.to);
  return { game, highlight: from, targets };
}

export function pawnDoubleStepDemo(): Demo {
  const game = emptyGame();
  const from: Coord = { file: 4, rank: 1 };
  const piece = place(game, from, 'P', 'w', { hasMoved: false });
  const targets = pieceDestinations(game.board, from, piece).map((m) => m.to);
  return { game, highlight: from, targets };
}

export function goldGeneralDemo(): Demo {
  return movementDemo('G', 'w', true);
}

export function dragonKingDemo(): Demo {
  return movementDemo('R', 'w', true);
}

export function dragonHorseDemo(): Demo {
  return movementDemo('B', 'w', true);
}

export function knightsTemplarDemo(): Demo {
  const game = emptyGame();
  place(game, { file: 4, rank: 0 }, 'K', 'w');
  place(game, { file: 4, rank: 7 }, 'K', 'b');
  place(game, { file: 0, rank: 0 }, 'B', 'w', { hasMoved: false });
  const knightCoord: Coord = { file: 1, rank: 0 };
  place(game, knightCoord, 'N', 'w', { hasMoved: false });
  place(game, { file: 7, rank: 7 }, 'B', 'b', { hasMoved: false });
  game.turn = 'b';
  game.applyMove({ kind: 'move', from: { file: 7, rank: 7 }, to: { file: 0, rank: 0 }, promote: false });

  const targets = game
    .legalMoves()
    .filter((m) => m.kind === 'move' && m.from.file === knightCoord.file && m.from.rank === knightCoord.rank)
    .map((m) => (m as any).to as Coord);
  return { game, highlight: knightCoord, targets };
}

export function enPassantDemo(): Demo {
  const game = emptyGame();
  place(game, { file: 4, rank: 0 }, 'K', 'w');
  place(game, { file: 4, rank: 7 }, 'K', 'b');
  const pawnCoord: Coord = { file: 4, rank: 4 };
  place(game, pawnCoord, 'P', 'w', { hasMoved: true });
  place(game, { file: 3, rank: 6 }, 'P', 'b', { hasMoved: false });
  game.turn = 'b';
  game.applyMove({ kind: 'move', from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, promote: false });

  const targets = game
    .legalMoves()
    .filter((m) => m.kind === 'move' && m.from.file === pawnCoord.file && m.from.rank === pawnCoord.rank)
    .map((m) => (m as any).to as Coord);
  return { game, highlight: pawnCoord, targets };
}

export function checkmateDemo(): Demo {
  const game = emptyGame();
  place(game, { file: 7, rank: 7 }, 'K', 'b');
  place(game, { file: 0, rank: 0 }, 'K', 'w');
  place(game, { file: 0, rank: 7 }, 'R', 'w');
  place(game, { file: 6, rank: 0 }, 'R', 'w');
  place(game, { file: 7, rank: 0 }, 'R', 'w');
  game.turn = 'b';
  const checkSquare = game.board.findKing('b');
  return { game, highlight: null, targets: [], checkSquare, checkmate: game.isCheckmate() };
}
