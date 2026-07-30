import type { Color, Coord, Move } from '@chegi/engine';
import { Game } from '@chegi/engine';
import { GeneralIcon } from './GeneralIcon.js';
import { pieceDisplayContent, type PieceSetId, usesLargeMark } from './pieceDisplay.js';

export type BoardTheme = 'wood' | 'green' | 'blue' | 'shogi';

export const BOARD_THEME_NAMES: Record<BoardTheme, string> = {
  wood: 'Wood',
  green: 'Green',
  blue: 'Blue',
  shogi: 'Shogi Grid',
};

interface Props {
  game: Game;
  selected: Coord | null;
  targets: Coord[];
  onSquareClick: (c: Coord) => void;
  /** Whose perspective the board is drawn from — that color's pieces render upright and sit at the bottom. */
  viewColor: Color;
  /** The most recent move, if any — its origin (for board moves) and destination get highlighted. */
  lastMove: Move | null;
  /** The square of the king currently in check, if any. */
  checkSquare: Coord | null;
  /** Whether the check on checkSquare is checkmate — drawn more intensely than a plain check. */
  checkmate: boolean;
  boardTheme: BoardTheme;
  pieceSet: PieceSetId;
}

function coordIn(list: Coord[], c: Coord): boolean {
  return list.some((t) => t.file === c.file && t.rank === c.rank);
}

const FILE_LETTERS = 'abcdefgh';

export default function Board({
  game,
  selected,
  targets,
  onSquareClick,
  viewColor,
  lastMove,
  checkSquare,
  checkmate,
  boardTheme,
  pieceSet,
}: Props) {
  // Rendered so viewColor's home rank is at the bottom, files ascending left to right from
  // that player's seat — a full 180° turn of the board, not a mirror, when viewColor is 'b'.
  const ranks = viewColor === 'w' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = viewColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const lastFrom = lastMove?.kind === 'move' ? lastMove.from : null;
  const lastTo = lastMove ? lastMove.to : null;

  return (
    <div className="board" data-theme={boardTheme}>
      {ranks.map((rank) =>
        files.map((file) => {
          const coord = { file, rank };
          const piece = game.board.get(coord);
          const dark = (file + rank) % 2 === 1;
          const isSelected = !!selected && selected.file === file && selected.rank === rank;
          const isTarget = coordIn(targets, coord);
          const isLastMove = (!!lastFrom && lastFrom.file === file && lastFrom.rank === rank) || (!!lastTo && lastTo.file === file && lastTo.rank === rank);
          const isCheckSquare = !!checkSquare && checkSquare.file === file && checkSquare.rank === rank;
          const isBottomRow = rank === ranks[ranks.length - 1];
          const isLeftColumn = file === files[0];
          const classes = ['square', dark ? 'dark' : 'light'];
          if (isLastMove) classes.push('last-move');
          if (isCheckSquare) classes.push(checkmate ? 'in-checkmate' : 'in-check');
          if (isSelected) classes.push('selected');
          if (isTarget) classes.push('target');

          const content = piece ? pieceDisplayContent(piece, pieceSet) : null;

          return (
            <div key={`${file},${rank}`} className={classes.join(' ')} onClick={() => onSquareClick(coord)}>
              {piece && content && (
                <span className={`piece-tile ${piece.color !== viewColor ? 'piece-flipped' : ''}`}>
                  <span className="piece-tile-outline" />
                  <span
                    className={`piece-tile-fill ${piece.promoted ? 'piece-promoted' : ''} ${usesLargeMark(piece, pieceSet) ? 'piece-tile-glyph' : ''}`}
                  >
                    {'icon' in content ? <GeneralIcon /> : content.text}
                  </span>
                </span>
              )}
              {isTarget && !piece && <span className="target-dot" />}
              {isTarget && piece && <span className="target-ring" />}
              {isLeftColumn && <span className="coord-rank">{rank + 1}</span>}
              {isBottomRow && <span className="coord-file">{FILE_LETTERS[file]}</span>}
            </div>
          );
        }),
      )}
    </div>
  );
}
