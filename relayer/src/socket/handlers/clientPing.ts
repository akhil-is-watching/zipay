import type { Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events.js';

export function registerClientPing(socket: Socket) {
  socket.on(CLIENT_EVENTS.PING, payload => {
    console.log('Received client:ping', payload);

    socket.emit(SERVER_EVENTS.PONG, {
      acknowledged: true,
      receivedAt: new Date().toISOString(),
    });
  });
}
