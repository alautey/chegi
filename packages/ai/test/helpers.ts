import { Board, freshId, Game } from '@chegi/engine';
import type { Color, Coord, PieceType } from '@chegi/engine';

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
) {
  game.board.set(coord, {
    type,
    color,
    promoted: opts.promoted ?? false,
    hasMoved: opts.hasMoved ?? false,
    id: freshId(),
  });
}
