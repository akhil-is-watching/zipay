import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socket.js';

const DEFAULT_PORT = Number(process.env.PORT) || 4000;

export function startServer(port = DEFAULT_PORT) {
  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`Socket.IO server listening on port ${port}`);
  });

  return { httpServer, io };
}
