import type { Server } from 'socket.io';
import { handleConnection } from './socket/connection.js';

export { CLIENT_EVENTS, SERVER_EVENTS, type ClientEventName, type ServerEventName } from './socket/events.js';

export function registerSocketHandlers(io: Server) {
  io.on('connection', handleConnection);
}
