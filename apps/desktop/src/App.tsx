import type { Difficulty } from '@chegi/ai';
import type { AppliedMove, Color, Coord, Move, PieceType, PromotablePieceType } from '@chegi/engine';
import { Game } from '@chegi/engine';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { AiRequest, AiResponse } from './aiWorker.js';
import Board, { type BoardTheme } from './Board.js';
import Hand from './Hand.js';
import LearnToPlay from './LearnToPlay.js';
import { PIECE_NAMES, type PieceSetId } from './pieceDisplay.js';
import { playMoveOutcomeSounds } from './sound.js';
import Themes from './Themes.js';
import { useOnlineGame } from './useOnlineGame.js';
import { useStoredState } from './useStoredState.js';

type DroppablePieceType = PromotablePieceType | 'Q';
type Selection = { kind: 'square'; coord: Coord } | { kind: 'hand'; pieceType: DroppablePieceType } | null;
type OpponentMode = 'human' | 'ai' | 'online';

function sameCoord(a: Coord, b: Coord): boolean {
  return a.file === b.file && a.rank === b.rank;
}

function dedupe(coords: Coord[]): Coord[] {
  const seen = new Set<string>();
  const out: Coord[] = [];
  for (const c of coords) {
    const key = `${c.file},${c.rank}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

export default function App() {
  const gameRef = useRef(new Game());
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const [selection, setSelection] = useState<Selection>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Coord; to: Coord } | null>(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  const [opponentMode, setOpponentMode] = useState<OpponentMode>('human');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [aiThinking, setAiThinking] = useState(false);

  const [serverUrl, setServerUrl] = useState('wss://chegi-relay.onrender.com');
  const [joinCode, setJoinCode] = useState('');
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [showLearn, setShowLearn] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  // null = viewing the live position; -1..history.length-1 = viewing the position
  // right after that history entry (-1 is the starting position, before any moves).
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [boardTheme, setBoardTheme] = useStoredState<BoardTheme>('chegi.boardTheme', 'wood', ['wood', 'green', 'blue', 'shogi']);
  const [pieceSet, setPieceSet] = useStoredState<PieceSetId>('chegi.pieceSet', 'chess', ['chess', 'letters', 'kanji']);

  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    const worker = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const game = gameRef.current;
  const legalMoves = useMemo(() => game.legalMoves(), [game, version]);
  const gameOver = legalMoves.length === 0 || gameOverMessage !== null;

  const reviewing = reviewIndex !== null;
  // Reviewing never mutates the live game — it replays moves into a throwaway
  // snapshot, the same trick used to rebuild state after an online create/join.
  const boardGame = useMemo(() => {
    if (reviewIndex === null) return game;
    const g = new Game();
    for (let i = 0; i <= reviewIndex; i++) g.applyMove(game.history[i].move);
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, version, reviewIndex]);

  function exitReview() {
    setReviewIndex(null);
  }

  function goToStart() {
    if (game.history.length === 0) return;
    setSelection(null);
    setReviewIndex(-1);
  }

  function goToPrev() {
    if (game.history.length === 0) return;
    setSelection(null);
    setReviewIndex((cur) => {
      const at = cur === null ? game.history.length - 1 : cur;
      return Math.max(-1, at - 1);
    });
  }

  function goToNext() {
    setSelection(null);
    setReviewIndex((cur) => {
      if (cur === null) return null;
      const next = cur + 1;
      return next >= game.history.length - 1 ? null : next;
    });
  }

  function resetLocalGame(history: AppliedMove[]) {
    const g = new Game();
    for (const h of history) g.applyMove(h.move);
    gameRef.current = g;
    setSelection(null);
    setPendingPromotion(null);
    setGameOverMessage(null);
    setReviewIndex(null);
    bump();
  }

  const online = useOnlineGame({
    onCreated: () => resetLocalGame([]),
    onJoined: (history) => resetLocalGame(history),
    onMove: (move) => {
      const applied = game.applyMove(move);
      playMoveOutcomeSounds(applied);
      setSelection(null);
      setPendingPromotion(null);
      bump();
    },
    onGameOver: (reason, winner) => {
      if (reason === 'checkmate') return; // already reflected by local legalMoves()/isInCheck()
      const winnerName = winner === 'w' ? 'White' : winner === 'b' ? 'Black' : null;
      setGameOverMessage(
        reason === 'resign' ? `${winnerName} wins by resignation` : 'Opponent disconnected',
      );
    },
  });

  const onlineTurnOk = opponentMode !== 'online' || (online.status === 'connected' && game.turn === online.color);

  // Whoever's perspective we draw the board from: fixed to the human's own color
  // against the AI or online, but flips each turn in hotseat so whoever's about
  // to move always sees their own pieces upright at the bottom.
  const viewColor: Color =
    opponentMode === 'ai' ? humanColor : opponentMode === 'online' ? online.color ?? 'w' : game.turn;

  // Hand trays sit next to whichever side of the board that color currently occupies —
  // bottomColor's pieces render at the bottom of the board (see viewColor above), so its
  // tray anchors to the bottom of the side panel, and swaps places when hotseat flips the board.
  const bottomColor: Color = viewColor;
  const topColor: Color = viewColor === 'w' ? 'b' : 'w';

  function commitMove(move: Move) {
    if (opponentMode === 'online') {
      online.sendMove(move);
    } else {
      const applied = game.applyMove(move);
      playMoveOutcomeSounds(applied);
      bump();
    }
  }

  useEffect(() => {
    if (opponentMode !== 'ai') return;
    if (game.turn === humanColor) return;
    if (gameOver) return;
    const worker = workerRef.current;
    if (!worker) return;

    setAiThinking(true);
    const request: AiRequest = { moves: game.history.map((h) => h.move), difficulty: aiDifficulty };

    const handleMessage = (e: MessageEvent<AiResponse>) => {
      const applied = game.applyMove(e.data.move);
      playMoveOutcomeSounds(applied);
      setAiThinking(false);
      setSelection(null);
      bump();
    };
    worker.addEventListener('message', handleMessage, { once: true });
    worker.postMessage(request);

    return () => {
      worker.removeEventListener('message', handleMessage);
      // Without this, switching mode/color mid-search leaves the UI stuck on "thinking".
      setAiThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentMode, humanColor, aiDifficulty, version, gameOver]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, version]);

  const targets = useMemo<Coord[]>(() => {
    if (!selection) return [];
    if (selection.kind === 'square') {
      return dedupe(
        legalMoves
          .filter((m) => m.kind === 'move' && sameCoord(m.from, selection.coord))
          .map((m) => (m as any).to as Coord),
      );
    }
    return dedupe(
      legalMoves.filter((m) => m.kind === 'drop' && m.pieceType === selection.pieceType).map((m) => m.to),
    );
  }, [legalMoves, selection]);

  function resetSelection() {
    setSelection(null);
  }

  function handleSquareClick(coord: Coord) {
    if (reviewing || pendingPromotion || aiThinking || gameOver || !onlineTurnOk) return;
    const piece = game.board.get(coord);

    if (!selection) {
      if (piece && piece.color === game.turn) setSelection({ kind: 'square', coord });
      return;
    }

    const isTarget = targets.some((t) => sameCoord(t, coord));

    if (selection.kind === 'square') {
      if (isTarget) {
        const variants = legalMoves.filter(
          (m) => m.kind === 'move' && sameCoord(m.from, selection.coord) && sameCoord(m.to, coord),
        );
        if (variants.length === 2) {
          setPendingPromotion({ from: selection.coord, to: coord });
        } else {
          commitMove(variants[0]);
          resetSelection();
        }
        return;
      }
    } else if (selection.kind === 'hand') {
      if (isTarget) {
        commitMove({ kind: 'drop', pieceType: selection.pieceType, to: coord });
        resetSelection();
        return;
      }
    }

    if (piece && piece.color === game.turn) {
      setSelection({ kind: 'square', coord });
    } else {
      resetSelection();
    }
  }

  function handleHandSelect(color: 'w' | 'b', type: PieceType) {
    if (reviewing || pendingPromotion || aiThinking || gameOver || !onlineTurnOk) return;
    if (color !== game.turn) return;
    if (type === 'K') return; // King can never be captured (capturing it ends the game), so never in hand
    setSelection({ kind: 'hand', pieceType: type });
  }

  function choosePromotion(promote: boolean) {
    if (!pendingPromotion) return;
    const move = legalMoves.find(
      (m) =>
        m.kind === 'move' &&
        sameCoord(m.from, pendingPromotion.from) &&
        sameCoord(m.to, pendingPromotion.to) &&
        m.promote === promote,
    );
    if (move) commitMove(move);
    setPendingPromotion(null);
    resetSelection();
  }

  function resign() {
    if (gameOver) return;
    setShowResignConfirm(true);
  }

  function confirmResign() {
    setShowResignConfirm(false);
    if (opponentMode === 'online') {
      online.resign();
      return;
    }
    // In hotseat, whoever's turn it is concedes; in vs-AI, resigning is always the human's decision.
    const resigningColor = opponentMode === 'ai' ? humanColor : game.turn;
    const winner: Color = resigningColor === 'w' ? 'b' : 'w';
    setGameOverMessage(`${winner === 'w' ? 'White' : 'Black'} wins by resignation`);
  }

  function newGame() {
    gameRef.current = new Game();
    resetSelection();
    setPendingPromotion(null);
    setShowResignConfirm(false);
    setAiThinking(false);
    setGameOverMessage(null);
    setReviewIndex(null);
    if (opponentMode === 'online') online.disconnect();
    bump();
  }

  const inCheck = game.isInCheck();
  const noMoves = legalMoves.length === 0;
  const checkSquare = inCheck ? game.board.findKing(game.turn) : null;
  const turnName = game.turn === 'w' ? 'White' : 'Black';
  let status: string;
  if (gameOverMessage) {
    status = gameOverMessage;
  } else if (noMoves && inCheck) {
    status = `Checkmate — ${game.turn === 'w' ? 'Black' : 'White'} wins`;
  } else if (noMoves) {
    status = `Stalemate — ${turnName} has no legal move`;
  } else if (aiThinking) {
    status = `${turnName} (AI) is thinking…`;
  } else if (opponentMode === 'online' && online.status === 'waiting') {
    status = `Waiting for opponent to join room ${online.roomId}…`;
  } else if (opponentMode === 'online' && online.status !== 'connected') {
    status = 'Not connected';
  } else {
    status = `${turnName} to move${inCheck ? ' — Check!' : ''}`;
  }

  // What actually gets drawn on the board: the live game normally, or a
  // read-only replayed snapshot while reviewing past moves.
  const boardInCheck = boardGame.isInCheck();
  const boardCheckSquare = boardInCheck ? boardGame.board.findKing(boardGame.turn) : null;
  const boardCheckmate = boardInCheck && boardGame.legalMoves().length === 0;
  const boardLastMove = boardGame.history.length > 0 ? boardGame.history[boardGame.history.length - 1].move : null;
  const displayStatus = reviewing
    ? reviewIndex === -1
      ? 'Start position'
      : `After move ${reviewIndex + 1} of ${game.history.length}`
    : status;

  const movingPieceType =
    selection?.kind === 'square' ? game.board.get(selection.coord)?.type : selection?.kind === 'hand' ? selection.pieceType : null;

  return (
    <div className="app">
      <div className="top-bar">
        <h1>Chegi</h1>
        <div className="game-settings">
          <label>
            Opponent
            <select
              value={opponentMode}
              onChange={(e) => {
                if (opponentMode === 'online') online.disconnect();
                setOpponentMode(e.target.value as OpponentMode);
              }}
            >
              <option value="human">Human (hotseat)</option>
              <option value="ai">AI</option>
              <option value="online">Online</option>
            </select>
          </label>
          {opponentMode === 'ai' && (
            <>
              <label>
                Difficulty
                <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label>
                Play as
                <select value={humanColor} onChange={(e) => setHumanColor(e.target.value as Color)}>
                  <option value="w">White</option>
                  <option value="b">Black</option>
                </select>
              </label>
            </>
          )}
        </div>
        <div className="top-bar-actions">
          {!gameOver && (opponentMode !== 'online' || online.status === 'connected') && (
            <button onClick={resign}>Resign</button>
          )}
          <button onClick={newGame}>New Game</button>
          <button onClick={() => setShowLearn(true)}>How to Play</button>
          <button onClick={() => setShowThemes(true)}>Themes</button>
        </div>
      </div>

      {opponentMode === 'online' && (
        <div className="online-bar">
          {online.status === 'idle' || online.status === 'closed' || online.status === 'error' ? (
            <>
              <input
                className="server-input"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="ws://server-address"
              />
              <button onClick={() => online.createGame(serverUrl)}>Create Game</button>
              <span className="online-divider">or</span>
              <input
                className="join-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={5}
              />
              <button onClick={() => online.joinGame(serverUrl, joinCode)} disabled={!joinCode}>
                Join Game
              </button>
            </>
          ) : (
            <>
              <span>
                Room <strong>{online.roomId}</strong> — you are {online.color === 'w' ? 'White' : 'Black'}
              </span>
              {online.status === 'waiting' && <span className="online-waiting">Share the code — waiting for your opponent…</span>}
              <button onClick={() => online.disconnect()}>Disconnect</button>
            </>
          )}
          {online.error && <span className="online-error">{online.error}</span>}
        </div>
      )}

      <div className="main">
        <div className="side side-left">
          <Hand
            color={topColor}
            hand={game.board.hands[topColor]}
            selectedType={selection?.kind === 'hand' && game.turn === topColor ? selection.pieceType : null}
            active={game.turn === topColor}
            onSelect={(t) => handleHandSelect(topColor, t)}
          />
          <Hand
            color={bottomColor}
            hand={game.board.hands[bottomColor]}
            selectedType={selection?.kind === 'hand' && game.turn === bottomColor ? selection.pieceType : null}
            active={game.turn === bottomColor}
            onSelect={(t) => handleHandSelect(bottomColor, t)}
          />
        </div>

        <div className="center">
          <div className={`status ${boardInCheck ? 'status-check' : ''}`}>
            {displayStatus}
            {reviewing && (
              <button className="live-button" onClick={exitReview}>
                Back to Live
              </button>
            )}
          </div>
          <Board
            game={boardGame}
            selected={reviewing ? null : selection?.kind === 'square' ? selection.coord : null}
            targets={reviewing ? [] : targets}
            onSquareClick={handleSquareClick}
            viewColor={viewColor}
            lastMove={boardLastMove}
            checkSquare={boardCheckSquare}
            checkmate={boardCheckmate}
            boardTheme={boardTheme}
            pieceSet={pieceSet}
          />
          {movingPieceType && <div className="hint">Moving: {PIECE_NAMES[movingPieceType]}</div>}
        </div>

        <div className="side side-right">
          <div className="history">
            <div className="history-label">Moves</div>
            <ol className="history-list">
              {game.history.map((h, i) => (
                <li key={i}>
                  <button
                    className={`move-entry ${h.color === 'w' ? 'move-white' : 'move-black'} ${reviewIndex === i ? 'active' : ''}`}
                    onClick={() => {
                      setSelection(null);
                      setReviewIndex(i);
                    }}
                  >
                    {h.notation}
                  </button>
                </li>
              ))}
            </ol>
            <div className="review-controls">
              <button onClick={goToStart} disabled={game.history.length === 0 || reviewIndex === -1} title="First move">
                ⏮
              </button>
              <button onClick={goToPrev} disabled={game.history.length === 0 || reviewIndex === -1} title="Previous move">
                ◀
              </button>
              <button onClick={goToNext} disabled={!reviewing} title="Next move">
                ▶
              </button>
              <button onClick={exitReview} disabled={!reviewing} title="Jump to current position">
                Live
              </button>
            </div>
          </div>
        </div>
      </div>

      {pendingPromotion && (
        <div className="modal-backdrop">
          <div className="modal">
            <p>Promote this piece?</p>
            <div className="modal-buttons">
              <button onClick={() => choosePromotion(true)}>Promote</button>
              <button onClick={() => choosePromotion(false)}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {showResignConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResignConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>Resign this game?</p>
            <div className="modal-buttons">
              <button onClick={confirmResign}>Resign</button>
              <button onClick={() => setShowResignConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showLearn && <LearnToPlay boardTheme={boardTheme} pieceSet={pieceSet} onClose={() => setShowLearn(false)} />}

      {showThemes && (
        <Themes
          boardTheme={boardTheme}
          pieceSet={pieceSet}
          onBoardTheme={setBoardTheme}
          onPieceSet={setPieceSet}
          onClose={() => setShowThemes(false)}
        />
      )}
    </div>
  );
}
