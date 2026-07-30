import { BOARD_THEME_NAMES, type BoardTheme } from './Board.js';
import { GeneralIcon } from './GeneralIcon.js';
import { PIECE_SET_NAMES, type PieceSetId } from './pieceDisplay.js';

const BOARD_THEMES: BoardTheme[] = ['wood', 'green', 'blue', 'shogi'];
const PIECE_SETS: PieceSetId[] = ['chess', 'letters', 'kanji'];

interface Props {
  boardTheme: BoardTheme;
  pieceSet: PieceSetId;
  onBoardTheme: (t: BoardTheme) => void;
  onPieceSet: (p: PieceSetId) => void;
  onClose: () => void;
}

function BoardSwatch({ theme }: { theme: BoardTheme }) {
  return (
    <div className={`swatch-board swatch-board-${theme}`}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

const KNIGHT_PREVIEW: Record<PieceSetId, string> = {
  chess: '♞',
  letters: 'N',
  kanji: '桂',
};

function PieceSetPreview({ set }: { set: PieceSetId }) {
  return (
    <div className="swatch-pieces">
      <span className="swatch-piece">{set === 'chess' ? <GeneralIcon /> : set === 'kanji' ? '銀' : 'G'}</span>
      <span className="swatch-piece">{KNIGHT_PREVIEW[set]}</span>
    </div>
  );
}

export default function Themes({ boardTheme, pieceSet, onBoardTheme, onPieceSet, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="themes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="learn-header">
          <h2>Themes</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="themes-body">
          <section>
            <h3>Board</h3>
            <div className="theme-options">
              {BOARD_THEMES.map((t) => (
                <button
                  key={t}
                  className={`theme-option ${boardTheme === t ? 'active' : ''}`}
                  onClick={() => onBoardTheme(t)}
                >
                  <BoardSwatch theme={t} />
                  <span>{BOARD_THEME_NAMES[t]}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Pieces</h3>
            <div className="theme-options">
              {PIECE_SETS.map((p) => (
                <button
                  key={p}
                  className={`theme-option ${pieceSet === p ? 'active' : ''}`}
                  onClick={() => onPieceSet(p)}
                >
                  <PieceSetPreview set={p} />
                  <span>{PIECE_SET_NAMES[p]}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
