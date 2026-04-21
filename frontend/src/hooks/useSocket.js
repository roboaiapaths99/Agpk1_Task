import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuth';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocket = (orgId) => {
    const socketRef = useRef(null);
    const { user, accessToken } = useAuthStore();

    useEffect(() => {
        if (!orgId || !user || !accessToken) return;

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            upgrade: false,
            withCredentials: true,
            auth: { token: accessToken }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to WebSocket Server');
            socket.emit('join', orgId);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [orgId, user, accessToken]);

    const emitEvent = (eventName, data) => {
        if (socketRef.current) {
            socketRef.current.emit(eventName, {
                ...data,
                orgId,
                userId: user?._id
            });
        }
    };

    const subscribeToEvent = (eventName, callback) => {
        if (socketRef.current) {
            socketRef.current.on(eventName, callback);
        }
    };
    const unsubscribeFromEvent = (eventName, callback) => {
        if (socketRef.current) {
            socketRef.current.off(eventName, callback);
        }
    };

    // Return the actual socket instance as well for more complex use cases
    return { emitEvent, subscribeToEvent, unsubscribeFromEvent, socket: socketRef };
};

export default useSocket;
