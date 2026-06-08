/**
 * Socket Connection Manager
 * Handles WebSocket reconnection, error recovery, and event management
 * Prevents socket disconnection from freezing the UI
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || window.location.origin;

let socketInstance = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

const socketConfig = {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: RECONNECT_DELAY,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    autoConnect: false,
    withCredentials: true
};

/**
 * Initialize socket with authentication
 */
export const initSocket = (accessToken, orgId) => {
    try {
        if (socketInstance && socketInstance.connected) {
            console.log('[Socket] Already connected');
            return socketInstance;
        }

        socketInstance = io(SOCKET_URL, {
            ...socketConfig,
            auth: {
                token: accessToken,
                orgId
            }
        });

        setupSocketListeners(orgId);
        return socketInstance;
    } catch (err) {
        console.error('[Socket] Initialization error:', err);
        return null;
    }
};

/**
 * Setup all socket event listeners
 */
const setupSocketListeners = (orgId) => {
    if (!socketInstance) return;

    socketInstance.on('connect', () => {
        console.log('[Socket] Connected to server');
        reconnectAttempts = 0;
        socketInstance.emit('join', orgId);
    });

    socketInstance.on('disconnect', (reason) => {
        console.warn('[Socket] Disconnected:', reason);
        // Socket.io will auto-reconnect based on config
    });

    socketInstance.on('connect_error', (error) => {
        reconnectAttempts++;
        console.error(`[Socket] Connection error (attempt ${reconnectAttempts}):`, error?.message);
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[Socket] Max reconnection attempts reached');
            // Could dispatch event to show user a message
        }
    });

    socketInstance.on('error', (error) => {
        console.error('[Socket] Error event:', error);
    });

    socketInstance.on('unauthorized', () => {
        console.error('[Socket] Unauthorized - token may have expired');
        // Trigger re-authentication
    });
};

/**
 * Emit event with error handling
 */
export const emitEvent = (eventName, data = {}, orgId = null, userId = null) => {
    try {
        if (!socketInstance || !socketInstance.connected) {
            console.warn(`[Socket] Cannot emit "${eventName}" - socket not connected`);
            return false;
        }

        socketInstance.emit(eventName, {
            ...data,
            ...(orgId && { orgId }),
            ...(userId && { userId }),
            timestamp: new Date().toISOString()
        });

        return true;
    } catch (err) {
        console.error(`[Socket] Error emitting "${eventName}":`, err);
        return false;
    }
};

/**
 * Subscribe to socket event with automatic cleanup
 */
export const onEvent = (eventName, callback) => {
    try {
        if (!socketInstance) {
            console.warn(`[Socket] Cannot subscribe to "${eventName}" - socket not initialized`);
            return () => {};
        }

        socketInstance.on(eventName, callback);

        // Return unsubscribe function
        return () => {
            if (socketInstance) {
                socketInstance.off(eventName, callback);
            }
        };
    } catch (err) {
        console.error(`[Socket] Error subscribing to "${eventName}":`, err);
        return () => {};
    }
};

/**
 * One-time event listener
 */
export const onceEvent = (eventName, callback) => {
    try {
        if (!socketInstance) {
            console.warn(`[Socket] Cannot subscribe once to "${eventName}" - socket not initialized`);
            return;
        }

        socketInstance.once(eventName, callback);
    } catch (err) {
        console.error(`[Socket] Error subscribing once to "${eventName}":`, err);
    }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => {
    return socketInstance && socketInstance.connected;
};

/**
 * Disconnect socket gracefully
 */
export const disconnectSocket = () => {
    try {
        if (socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
            reconnectAttempts = 0;
        }
    } catch (err) {
        console.error('[Socket] Error disconnecting:', err);
    }
};

/**
 * Force reconnection
 */
export const reconnectSocket = () => {
    try {
        if (socketInstance) {
            socketInstance.connect();
        }
    } catch (err) {
        console.error('[Socket] Error reconnecting:', err);
    }
};

export default {
    initSocket,
    emitEvent,
    onEvent,
    onceEvent,
    isSocketConnected,
    disconnectSocket,
    reconnectSocket
};
