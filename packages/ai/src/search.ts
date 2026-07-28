import { Game, Move } from '@chegi/engine';
import { evaluate, pieceValue } from './evaluate.js';

const MATE_SCORE = 1_000_000;

export interface SearchOptions {
  maxDepth: number;
  timeBudgetMs: number;
}

function moveOrderScore(game: Game, move: Move): number {
  if (move.kind === 'drop') return 0;
  const target = game.board.get(move.to);
  let score = target ? pieceValue(target) * 10 : 0;
  if (move.promote) score += 50;
  return score;
}

function orderMoves(game: Game, moves: Move[], preferred: Move | null): Move[] {
  const scored = moves
    .map((m) => ({ m, s: moveOrderScore(game, m) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
  if (!preferred) return scored;
  const idx = scored.findIndex((m) => m === preferred);
  if (idx > 0) {
    scored.splice(idx, 1);
    scored.unshift(preferred);
  }
  return scored;
}

class SearchTimeout extends Error {}

/** Negamax with alpha-beta pruning. Returns a score from the perspective of `game.turn` at this node. */
function negamax(game: Game, depth: number, ply: number, alpha: number, beta: number, deadline: number): number {
  if (Date.now() > deadline) throw new SearchTimeout();

  const legal = game.legalMoves();

  if (legal.length === 0) {
    if (game.isInCheck()) return -(MATE_SCORE - ply);
    return 0; // no defined draw/stalemate rule — treat as neutral
  }

  if (depth === 0) return evaluate(game, game.turn);

  let best = -Infinity;
  for (const move of orderMoves(game, legal, null)) {
    const child = game.clone();
    child.applyMove(move);
    const score = -negamax(child, depth - 1, ply + 1, -beta, -alpha, deadline);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export function chooseMove(game: Game, options: SearchOptions): Move {
  const legal = game.legalMoves();
  if (legal.length === 0) throw new Error('no legal moves available');
  if (legal.length === 1) return legal[0];

  const deadline = Date.now() + options.timeBudgetMs;
  let bestMove: Move = legal[0];

  for (let depth = 1; depth <= options.maxDepth; depth++) {
    let alpha = -Infinity;
    const beta = Infinity;
    let currentBest = bestMove;
    let currentBestScore = -Infinity;

    try {
      for (const move of orderMoves(game, legal, bestMove)) {
        const child = game.clone();
        child.applyMove(move);
        const score = -negamax(child, depth - 1, 1, -beta, -alpha, deadline);
        if (score > currentBestScore) {
          currentBestScore = score;
          currentBest = move;
        }
        if (score > alpha) alpha = score;
      }
    } catch (e) {
      // Keep the best move from the last fully completed depth.
      if (e instanceof SearchTimeout) break;
      throw e;
    }

    bestMove = currentBest;
    if (Date.now() > deadline) break;
  }

  return bestMove;
}
