import type { Socket } from 'socket.io';
import { emitWelcome } from './emitters/welcome';
import { registerClientPing } from './handlers/clientPing';
import { registerDisconnect } from './handlers/disconnect';
import { registerQuoteRequest } from './handlers/quoteRequest';

export function handleConnection(socket: Socket) {
  console.log(`Client connected: ${socket.id}`);

  emitWelcome(socket);
  registerClientPing(socket);
  registerQuoteRequest(socket);
  registerDisconnect(socket);
}
