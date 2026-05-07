import { io } from 'socket.io-client';

let socket;

export const initSocket = (token) => {
    if (socket) return socket;

    socket = io(process.env.REACT_APP_API_URL || window.location.origin, {
        auth: { token },
        transports: ['websocket'],
    });

    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

export const getIO = () => {
    if (!socket) {
        // Attempt to get token from storage if not initialized
        const token = localStorage.getItem('token');
        if (token) return initSocket(token);
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
