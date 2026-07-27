import type { Color, Move } from '@chegi/engine';
import type { ClientMessage, GameOverReason, ServerMessage } from '@chegi/server/protocol';
import { useCallback, useEffect, useRef, useState } from 'react';

export type OnlineStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'closed' | 'error';

export interface UseOnlineGameOptions {
  onMove: (move: Move) => void;
  onGameOver: (reason: GameOverReason, winner: Color | null) => void;
}

export function useOnlineGame({ onMove, onGameOver }: UseOnlineGameOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<OnlineStatus>('idle');
  const [color, setColor] = useState<Color | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs so the long-lived socket handler always calls the latest callback.
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
    setColor(null);
    setRoomId(null);
    setError(null);
  }, []);

  const connect = useCallback((serverUrl: string, initialMessage: ClientMessage) => {
    wsRef.current?.close();
    setError(null);
    setStatus('connecting');
    setColor(null);
    setRoomId(null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(serverUrl);
    } catch {
      setStatus('error');
      setError('Invalid server address');
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify(initialMessage));
    ws.onerror = () => {
      setStatus('error');
      setError('Could not connect to server');
    };
    ws.onclose = () => setStatus((s) => (s === 'error' ? s : 'closed'));

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      switch (msg.type) {
        case 'created':
          setColor(msg.color);
          setRoomId(msg.roomId);
          setStatus('waiting');
          break;
        case 'joined':
          setColor(msg.color);
          setRoomId(msg.roomId);
          setStatus('connected');
          break;
        case 'opponent_joined':
          setStatus('connected');
          break;
        case 'move':
          onMoveRef.current(msg.applied.move);
          break;
        case 'opponent_left':
          setError('Opponent disconnected');
          setStatus('closed');
          break;
        case 'game_over':
          onGameOverRef.current(msg.reason, msg.winner);
          break;
        case 'error':
          setError(msg.message);
          break;
      }
    };
  }, []);

  const createGame = useCallback((serverUrl: string) => connect(serverUrl, { type: 'create' }), [connect]);
  const joinGame = useCallback(
    (serverUrl: string, roomIdToJoin: string) => connect(serverUrl, { type: 'join', roomId: roomIdToJoin }),
    [connect],
  );

  const sendMove = useCallback((move: Move) => {
    wsRef.current?.send(JSON.stringify({ type: 'move', move } satisfies ClientMessage));
  }, []);

  const resign = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'resign' } satisfies ClientMessage));
  }, []);

  useEffect(() => () => wsRef.current?.close(), []);

  return { status, color, roomId, error, createGame, joinGame, sendMove, resign, disconnect };
}
