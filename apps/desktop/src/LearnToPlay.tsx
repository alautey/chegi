import { useState } from 'react';
import type { BoardTheme } from './Board.js';
import Board from './Board.js';
import type { Demo } from './learnDemos.js';
import {
  bishopDemo,
  checkmateDemo,
  dragonHorseDemo,
  dragonKingDemo,
  enPassantDemo,
  generalDemo,
  goldGeneralDemo,
  kingDemo,
  knightDemo,
  knightsTemplarDemo,
  pawnDemo,
  pawnDoubleStepDemo,
  queenDemo,
  rookDemo,
} from './learnDemos.js';
import type { PieceSetId } from './pieceDisplay.js';

type SectionKey = 'moves' | 'promotion' | 'drops' | 'templar' | 'enpassant' | 'checkmate';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'moves', label: 'Pieces & Moves' },
  { key: 'promotion', label: 'Promotion' },
  { key: 'drops', label: 'Dropping Pieces' },
  { key: 'templar', label: 'Knights Templar' },
  { key: 'enpassant', label: 'En Passant' },
  { key: 'checkmate', label: 'Checkmate' },
];

interface ThemeProps {
  boardTheme: BoardTheme;
  pieceSet: PieceSetId;
}

function DemoBoard({ demo, caption, boardTheme, pieceSet }: { demo: Demo; caption?: string } & ThemeProps) {
  return (
    <div className="demo-board-item">
      <div className="demo-board-wrap">
        <Board
          game={demo.game}
          selected={demo.highlight}
          targets={demo.targets}
          onSquareClick={() => {}}
          viewColor="w"
          lastMove={null}
          checkSquare={demo.checkSquare ?? null}
          checkmate={demo.checkmate ?? false}
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>
      {caption && <div className="demo-caption">{caption}</div>}
    </div>
  );
}

function MovesSection({ boardTheme, pieceSet }: ThemeProps) {
  return (
    <div className="learn-section">
      <p>
        Every piece lies flat on the board — your own pieces point away from you, the opponent's point away from
        them. Capturing works exactly like moving: land on an enemy piece and it joins your hand.
      </p>
      <div className="demo-grid">
        <DemoBoard demo={kingDemo()} caption="King — one step in any direction." boardTheme={boardTheme} pieceSet={pieceSet} />
        <DemoBoard demo={queenDemo()} caption="Queen — any distance, straight or diagonal." boardTheme={boardTheme} pieceSet={pieceSet} />
        <DemoBoard demo={rookDemo()} caption="Rook — any distance, straight only." boardTheme={boardTheme} pieceSet={pieceSet} />
        <DemoBoard demo={bishopDemo()} caption="Bishop — any distance, diagonal only." boardTheme={boardTheme} pieceSet={pieceSet} />
        <DemoBoard
          demo={generalDemo()}
          caption="General — one step forward, both forward diagonals, or either backward diagonal (never sideways or straight back)."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
        <DemoBoard
          demo={knightDemo()}
          caption="Knight — a full set of eight L-shaped jumps in any direction, same as a chess knight. It jumps over other pieces."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
        <DemoBoard
          demo={pawnDemo()}
          caption="Pawn — one step straight ahead (only into an empty square); captures only diagonally ahead."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
        <DemoBoard
          demo={pawnDoubleStepDemo()}
          caption="Pawn on its own starting square may advance two steps instead of one."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>
    </div>
  );
}

function PromotionSection({ boardTheme, pieceSet }: ThemeProps) {
  return (
    <div className="learn-section">
      <p>
        Every piece except the King and Queen can promote. A piece becomes eligible the moment its move starts,
        ends, or passes through the row furthest from you. Promotion is your choice — except when declining would
        leave the piece completely unable to move afterward (a Pawn reaching the last row must promote, since it
        would otherwise have no legal move left).
      </p>
      <p>Promoting flips the piece over — its mark turns red to show it.</p>
      <div className="demo-grid">
        <DemoBoard
          demo={goldGeneralDemo()}
          caption="General, Knight, or Pawn promotes into a Gold General — one step any direction except diagonally backward."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
        <DemoBoard
          demo={dragonKingDemo()}
          caption="Rook promotes into a Dragon King — everything a Rook can do, plus one step diagonally."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
        <DemoBoard
          demo={dragonHorseDemo()}
          caption="Bishop promotes into a Dragon Horse — everything a Bishop can do, plus one step straight."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>
      <p className="learn-note">
        A captured piece always reverts to its unpromoted form the moment it's captured — it re-enters play from
        your hand as a plain piece, whatever it was before capture.
      </p>
    </div>
  );
}

function DropsSection() {
  return (
    <div className="learn-section">
      <p>
        Every piece you capture joins your hand instead of leaving the game. On any later turn, instead of moving a
        piece already on the board, you may drop one from your hand onto any empty square.
      </p>
      <ul className="learn-list">
        <li>A dropped piece must have at least one legal move available afterward — you can't drop a Pawn onto the last row, for instance, since it would have nowhere to go.</li>
        <li>You can't drop a Pawn onto a file — or diagonal — where you already have an unpromoted Pawn.</li>
        <li>You can't deliver checkmate with a Pawn drop. (Dropping any other piece for checkmate is fine.)</li>
        <li>Dropped pieces always come back unpromoted, even if they were promoted when captured.</li>
      </ul>
    </div>
  );
}

function TemplarSection({ boardTheme, pieceSet }: ThemeProps) {
  return (
    <div className="learn-section">
      <p>
        A rare one-time exception: if a Bishop captures an enemy Bishop while making its very first move — straight
        off its own home corner — the victim gets a free shot back. On their very next turn only, their Knight next
        to that home corner may leap straight to the capturing Bishop's square and take it, as long as that Knight
        hasn't moved yet either. Miss the window and it's gone for good.
      </p>
      <div className="demo-grid">
        <DemoBoard
          demo={knightsTemplarDemo()}
          caption="Black's Bishop just captured White's Bishop from h8, its first move. White's b1 Knight now has one extra option — a straight leap to a1 to recapture it — on top of its normal knight moves."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>
    </div>
  );
}

function EnPassantSection({ boardTheme, pieceSet }: ThemeProps) {
  return (
    <div className="learn-section">
      <p>
        If an enemy Pawn advances two squares and lands right beside yours, you may capture it as though it had only
        moved one square — diagonally, onto the square it skipped over. You must do this on your very next turn, or
        the chance is gone.
      </p>
      <div className="demo-grid">
        <DemoBoard
          demo={enPassantDemo()}
          caption="Black's d-pawn just double-stepped past White's e-pawn. White may capture it en passant, landing on d6 — alongside the normal push to e6."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>
    </div>
  );
}

function CheckmateSection({ boardTheme, pieceSet }: ThemeProps) {
  return (
    <div className="learn-section">
      <p>The object of the game is to capture the opponent's King. In practice, play stops at checkmate:</p>
      <ul className="learn-list">
        <li>
          <strong>Check</strong> — your King is under attack. You must respond: move it to safety, block the attack,
          or capture the attacker. The King's square turns red.
        </li>
        <li>
          <strong>Checkmate</strong> — you're in check with no way out. The game ends. The King's square turns a
          deeper red with a ring around it.
        </li>
        <li>You may also resign at any time instead of playing on.</li>
      </ul>
      <div className="demo-grid">
        <DemoBoard
          demo={checkmateDemo()}
          caption="Black's King is cornered on h8 with all three escape squares covered — checkmate."
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>
    </div>
  );
}

function renderSection(key: SectionKey, themeProps: ThemeProps) {
  switch (key) {
    case 'moves':
      return <MovesSection {...themeProps} />;
    case 'promotion':
      return <PromotionSection {...themeProps} />;
    case 'drops':
      return <DropsSection />;
    case 'templar':
      return <TemplarSection {...themeProps} />;
    case 'enpassant':
      return <EnPassantSection {...themeProps} />;
    case 'checkmate':
      return <CheckmateSection {...themeProps} />;
  }
}

export default function LearnToPlay({ boardTheme, pieceSet, onClose }: ThemeProps & { onClose: () => void }) {
  const [section, setSection] = useState<SectionKey>('moves');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="learn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="learn-header">
          <h2>How to Play</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="learn-body">
          <nav className="learn-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                className={`learn-nav-item ${section === s.key ? 'active' : ''}`}
                onClick={() => setSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="learn-content">{renderSection(section, { boardTheme, pieceSet })}</div>
        </div>
      </div>
    </div>
  );
}
