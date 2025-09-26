import type { Socket } from 'socket.io';

export function registerDisconnect(socket: Socket) {
  socket.on('disconnect', reason => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
  });
}
