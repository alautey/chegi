import type { Color, Coord } from '@chegi/engine';
import { Game } from '@chegi/engine';
import { GeneralIcon } from './GeneralIcon.js';
import { pieceMark, pieceUsesGlyph } from './pieceDisplay.js';

interface Props {
  game: Game;
  selected: Coord | null;
  targets: Coord[];
  onSquareClick: (c: Coord) => void;
  /** Whose perspective the board is drawn from — that color's pieces render upright and sit at the bottom. */
  viewColor: Color;
}

function coordIn(list: Coord[], c: Coord): boolean {
  return list.some((t) => t.file === c.file && t.rank === c.rank);
}

export default function Board({ game, selected, targets, onSquareClick, viewColor }: Props) {
  // Rendered so viewColor's home rank is at the bottom, files ascending left to right from
  // that player's seat — a full 180° turn of the board, not a mirror, when viewColor is 'b'.
  const ranks = viewColor === 'w' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = viewColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="board">
      {ranks.map((rank) =>
        files.map((file) => {
          const coord = { file, rank };
          const piece = game.board.get(coord);
          const dark = (file + rank) % 2 === 1;
          const isSelected = !!selected && selected.file === file && selected.rank === rank;
          const isTarget = coordIn(targets, coord);
          const classes = ['square', dark ? 'dark' : 'light'];
          if (isSelected) classes.push('selected');
          if (isTarget) classes.push('target');

          return (
            <div key={`${file},${rank}`} className={classes.join(' ')} onClick={() => onSquareClick(coord)}>
              {piece && (
                <span
                  className={`piece-tile ${piece.color !== viewColor ? 'piece-flipped' : ''} ${piece.promoted ? 'piece-promoted' : ''} ${pieceUsesGlyph(piece) ? 'piece-tile-glyph' : ''}`}
                >
                  {piece.type === 'G' ? <GeneralIcon /> : pieceMark(piece)}
                </span>
              )}
              {isTarget && !piece && <span className="target-dot" />}
              {isTarget && piece && <span className="target-ring" />}
            </div>
          );
        }),
      )}
    </div>
  );
}
