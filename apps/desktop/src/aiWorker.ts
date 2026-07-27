import type { Difficulty } from '@chegi/ai';
import { chooseMove, DIFFICULTY_PRESETS } from '@chegi/ai';
import type { Move } from '@chegi/engine';
import { Game } from '@chegi/engine';

export interface AiRequest {
  moves: Move[];
  difficulty: Difficulty;
}

export interface AiResponse {
  move: Move;
}

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { moves, difficulty } = event.data;
  const game = new Game();
  for (const move of moves) game.applyMove(move);

  const move = chooseMove(game, DIFFICULTY_PRESETS[difficulty]);
  const response: AiResponse = { move };
  (self as unknown as Worker).postMessage(response);
};
