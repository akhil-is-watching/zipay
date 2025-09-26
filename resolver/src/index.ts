import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:4000';
const RECONNECT_DELAY = 5000;
const PING_INTERVAL = 10000;

let socket: Socket | null = null;
let pingInterval: NodeJS.Timeout | null = null;

function start(): void {
    console.log('🚀 Starting Socket.IO resolver...');
    connect();
}

function connect(): void {
    console.log(`🔌 Connecting to Socket.IO server: ${SOCKET_URL}`);
    
    socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling']
    });
    
    setupEventHandlers();
}

function setupEventHandlers(): void {
    if (!socket) return;

    socket.on('connect', () => {
        console.log('✅ Socket.IO connection established');
        console.log(`📝 Socket ID: ${socket?.id}`);
        
        startPingInterval();
    });

    socket.on('server:welcome', (data: any) => {
        const timestamp = new Date().toISOString();
        console.log(`📨 [${timestamp}] Received welcome message:`);
        console.log(JSON.stringify(data, null, 2));
    });

    socket.on('server:pong', (data: any) => {
        const timestamp = new Date().toISOString();
        console.log(`🏓 [${timestamp}] Received pong:`);
        console.log(JSON.stringify(data, null, 2));
    });

    socket.on('message', (data: any) => {
        const timestamp = new Date().toISOString();
        console.log(`📨 [${timestamp}] Message received:`);
        
        try {
            if (typeof data === 'object') {
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(data);
            }
        } catch {
            console.log(data);
        }
    });

    socket.on('disconnect', (reason: string) => {
        console.log(`🔌 Socket.IO connection disconnected. Reason: ${reason}`);
        stopPingInterval();
    });

    socket.on('connect_error', (error: Error) => {
        console.error(`❌ Connection error: ${error.message}`);
    });

    socket.on('reconnect', (attemptNumber: number) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        startPingInterval();
    });

    socket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log(`⏳ Reconnection attempt #${attemptNumber}`);
    });

    socket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed');
    });
}

function startPingInterval(): void {
    stopPingInterval();
    
    console.log(`⏰ Starting ping interval (every ${PING_INTERVAL / 1000} seconds)`);
    
    sendPing();
    
    pingInterval = setInterval(() => {
        sendPing();
    }, PING_INTERVAL);
}

function stopPingInterval(): void {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
        console.log('⏹️ Stopped ping interval');
    }
}

function sendPing(): void {
    if (socket?.connected) {
        const pingData = {
            timestamp: new Date().toISOString(),
            socketId: socket.id
        };
        console.log(`📤 Sending ping: ${JSON.stringify(pingData)}`);
        socket.emit('client:ping', pingData);
    }
}

function shutdown(): void {
    console.log('👋 Shutting down Socket.IO resolver...');
    
    stopPingInterval();
    
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();