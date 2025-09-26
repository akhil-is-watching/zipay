import type { Server } from 'socket.io';
import { handleConnection } from './socket/connection';

export { CLIENT_EVENTS, SERVER_EVENTS, type ClientEventName, type ServerEventName } from './socket/events';

export function registerSocketHandlers(io: Server) {
  io.on('connection', handleConnection);
}
