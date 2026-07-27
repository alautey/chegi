import { Game, Move } from '@chegi/engine';
import { chooseMove, SearchOptions } from './search.js';

export { evaluate, pieceValue, handPieceValue } from './evaluate.js';
export { chooseMove } from './search.js';
export type { SearchOptions } from './search.js';

export const DIFFICULTY_PRESETS: Record<string, SearchOptions> = {
  easy: { maxDepth: 2, timeBudgetMs: 500 },
  medium: { maxDepth: 3, timeBudgetMs: 1500 },
  hard: { maxDepth: 4, timeBudgetMs: 4000 },
};

export type Difficulty = keyof typeof DIFFICULTY_PRESETS;

export function chooseMoveForDifficulty(game: Game, difficulty: Difficulty): Move {
  return chooseMove(game, DIFFICULTY_PRESETS[difficulty]);
}
