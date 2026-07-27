import type { AppliedMove, Color, Move } from '@chegi/engine';

export type ClientMessage =
  | { type: 'create' }
  | { type: 'join'; roomId: string }
  | { type: 'move'; move: Move }
  | { type: 'resign' };

export type GameOverReason = 'checkmate' | 'resign' | 'opponent_left';

export type ServerMessage =
  | { type: 'created'; roomId: string; color: Color }
  | { type: 'joined'; roomId: string; color: Color; history: AppliedMove[]; turn: Color }
  | { type: 'opponent_joined' }
  | { type: 'opponent_left' }
  | { type: 'move'; applied: AppliedMove; turn: Color }
  | { type: 'game_over'; reason: GameOverReason; winner: Color | null }
  | { type: 'error'; message: string };
