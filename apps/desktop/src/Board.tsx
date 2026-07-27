import type { Coord } from '@chegi/engine';
import { Game } from '@chegi/engine';
import { GeneralGlyph, hasChessGlyph, PieceGlyph } from './PieceGlyph.js';
import { pieceLabel } from './pieceDisplay.js';

interface Props {
  game: Game;
  selected: Coord | null;
  targets: Coord[];
  onSquareClick: (c: Coord) => void;
}

function coordIn(list: Coord[], c: Coord): boolean {
  return list.some((t) => t.file === c.file && t.rank === c.rank);
}

export default function Board({ game, selected, targets, onSquareClick }: Props) {
  // Rendered top-to-bottom as Black's home rank (7) down to White's (0), files a-h left to right.
  const ranks = [7, 6, 5, 4, 3, 2, 1, 0];
  const files = [0, 1, 2, 3, 4, 5, 6, 7];

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
              {piece &&
                (hasChessGlyph(piece) ? (
                  <PieceGlyph type={piece.type as 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'} color={piece.color} promoted={piece.promoted} />
                ) : piece.type === 'G' && !piece.promoted ? (
                  <GeneralGlyph color={piece.color} />
                ) : (
                  <span className={`piece-tile piece-tile-${piece.color}`}>{pieceLabel(piece)}</span>
                ))}
              {isTarget && !piece && <span className="target-dot" />}
              {isTarget && piece && <span className="target-ring" />}
            </div>
          );
        }),
      )}
    </div>
  );
}
