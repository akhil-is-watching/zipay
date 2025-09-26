import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT) || 4000;

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', socket => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('server:welcome', { message: 'Hello from the relayer server!' });

  socket.on('client:ping', payload => {
    console.log('Received client:ping', payload);
    socket.emit('server:pong', { acknowledged: true, receivedAt: new Date().toISOString() });
  });

  socket.on('disconnect', reason => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});
