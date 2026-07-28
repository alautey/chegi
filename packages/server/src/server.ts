import type { Color } from '@chegi/engine';
import http from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from './protocol.js';
import { RoomManager } from './rooms.js';

const PORT = Number(process.env.PORT) || 8080;

const rooms = new RoomManager();

interface SocketState {
  roomId: string | null;
  color: Color | null;
}

const sockets = new Map<WebSocket, SocketState>();
// roomId -> color -> socket, so we can reach "the other player" for relay/broadcast.
const roomSockets = new Map<string, Partial<Record<Color, WebSocket>>>();

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

function opponentOf(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

function sendToOpponent(roomId: string, color: Color, message: ServerMessage): void {
  const seat = roomSockets.get(roomId);
  const opponentSocket = seat?.[opponentOf(color)];
  if (opponentSocket) send(opponentSocket, message);
}

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Chegi multiplayer relay is running.\n');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  sockets.set(ws, { roomId: null, color: null });

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      const parsed: unknown = JSON.parse(raw.toString());
      if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { type?: unknown }).type !== 'string') {
        throw new Error('not a message object');
      }
      msg = parsed as ClientMessage;
    } catch {
      send(ws, { type: 'error', message: 'Malformed message' });
      return;
    }

    const state = sockets.get(ws)!;

    switch (msg.type) {
      case 'create': {
        if (state.roomId) {
          send(ws, { type: 'error', message: 'Already in a game' });
          return;
        }
        const { room, color } = rooms.createRoom();
        state.roomId = room.id;
        state.color = color;
        roomSockets.set(room.id, { [color]: ws });
        send(ws, { type: 'created', roomId: room.id, color });
        break;
      }

      case 'join': {
        if (state.roomId) {
          send(ws, { type: 'error', message: 'Already in a game' });
          return;
        }
        const result = rooms.joinRoom(msg.roomId);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.error });
          return;
        }
        state.roomId = result.room.id;
        state.color = result.color;
        const seat = roomSockets.get(result.room.id) ?? {};
        seat[result.color] = ws;
        roomSockets.set(result.room.id, seat);

        send(ws, {
          type: 'joined',
          roomId: result.room.id,
          color: result.color,
          history: result.room.game.history,
          turn: result.room.game.turn,
        });
        sendToOpponent(result.room.id, result.color, { type: 'opponent_joined' });
        break;
      }

      case 'move': {
        if (!state.roomId || !state.color) {
          send(ws, { type: 'error', message: 'Not in a game' });
          return;
        }
        const result = rooms.applyMove(state.roomId, state.color, msg.move);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.error });
          return;
        }

        const moveMsg: ServerMessage = { type: 'move', applied: result.applied, turn: result.room.game.turn };
        send(ws, moveMsg);
        sendToOpponent(state.roomId, state.color, moveMsg);

        if (result.applied.checkmate) {
          const overMsg: ServerMessage = { type: 'game_over', reason: 'checkmate', winner: state.color };
          send(ws, overMsg);
          sendToOpponent(state.roomId, state.color, overMsg);
        }
        break;
      }

      case 'resign': {
        if (!state.roomId || !state.color) return;
        rooms.endGame(state.roomId);
        const overMsg: ServerMessage = { type: 'game_over', reason: 'resign', winner: opponentOf(state.color) };
        send(ws, overMsg);
        sendToOpponent(state.roomId, state.color, overMsg);
        break;
      }
    }
  });

  ws.on('close', () => {
    const state = sockets.get(ws);
    sockets.delete(ws);
    if (!state?.roomId || !state.color) return;

    sendToOpponent(state.roomId, state.color, { type: 'opponent_left' });
    rooms.removeRoom(state.roomId);
    roomSockets.delete(state.roomId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chegi relay server listening on port ${PORT}`);
});
