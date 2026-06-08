/**
 * Improved useSocket Hook
 * Uses the centralized socket manager for better connection handling
 * Prevents memory leaks and ensures proper cleanup
 */

import { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../store/useAuth';
import {
    initSocket,
    emitEvent as emit,
    onEvent,
    isSocketConnected,
    disconnectSocket
} from '../utils/socketManager';

export const useSocket = (orgId) => {
    const { user, accessToken } = useAuthStore();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Don't initialize if missing required data
        if (!orgId || !user || !accessToken) {
            console.log('[useSocket] Waiting for auth data', { orgId, user: !!user, token: !!accessToken });
            return;
        }

        // Initialize socket
        const socket = initSocket(accessToken, orgId);
        if (!socket) {
            setError('Failed to initialize socket');
            return;
        }

        // Listen for connection status
        const unsubscribeConnect = onEvent('connect', () => {
            setIsConnected(true);
            setError(null);
        });

        const unsubscribeDisconnect = onEvent('disconnect', () => {
            setIsConnected(false);
        });

        const unsubscribeError = onEvent('error', (err) => {
            setError(err?.message || 'Socket error');
        });

        const unsubscribeConnectError = onEvent('connect_error', (err) => {
            setError(err?.message || 'Connection error');
        });

        // Cleanup on unmount
        return () => {
            unsubscribeConnect();
            unsubscribeDisconnect();
            unsubscribeError();
            unsubscribeConnectError();
        };
    }, [orgId, user, accessToken]);

    // Safe emit wrapper
    const emitEvent = useCallback((eventName, data = {}) => {
        if (!isSocketConnected()) {
            console.warn(`[useSocket] Cannot emit "${eventName}" - not connected`);
            return false;
        }

        return emit(eventName, data, orgId, user?._id);
    }, [orgId, user]);

    // Safe subscribe wrapper
    const subscribeToEvent = useCallback((eventName, callback) => {
        return onEvent(eventName, callback);
    }, []);

    // Safe unsubscribe wrapper
    const unsubscribeFromEvent = useCallback((eventName, callback) => {
        const socket = initSocket(accessToken, orgId);
        if (socket) {
            socket.off(eventName, callback);
        }
    }, [accessToken, orgId]);

    return {
        isConnected,
        error,
        emitEvent,
        subscribeToEvent,
        unsubscribeFromEvent,
        socket: { connected: isSocketConnected() }
    };
};

export default useSocket;
