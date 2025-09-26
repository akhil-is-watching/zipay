import type { Socket } from 'socket.io';
import { SERVER_EVENTS } from '../events';

export function emitWelcome(socket: Socket) {
  socket.emit(SERVER_EVENTS.WELCOME, { message: 'Hello from the relayer server!' });
}
