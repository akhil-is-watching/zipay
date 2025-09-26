import type { Socket } from 'socket.io';
import { emitWelcome } from './emitters/welcome.js';
import { registerClientPing } from './handlers/clientPing.js';
import { registerDisconnect } from './handlers/disconnect.js';

export function handleConnection(socket: Socket) {
  console.log(`Client connected: ${socket.id}`);

  emitWelcome(socket);
  registerClientPing(socket);
  registerDisconnect(socket);
}
