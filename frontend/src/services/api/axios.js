import axios from 'axios';
import toast from 'react-hot-toast';

export const BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;
export const API_URL = `${BASE_URL}/api/v1`;

/**
 * Maps HTTP status codes to user-friendly error messages.
 * These are used as fallbacks when the backend doesn't provide a clean message.
 */
const FRIENDLY_MESSAGES = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Your session has expired. Please log in again.',
    403: 'You don\'t have permission to do this.',
    404: 'The item you\'re looking for was not found.',
    409: 'This item already exists or conflicts with existing data.',
    422: 'Unable to process the request. Please verify your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong. Please try again later.',
    502: 'Server is temporarily unavailable. Please try again shortly.',
    503: 'Service is under maintenance. Please try again later.',
};

/**
 * Returns a clean, user-friendly error message.
 * Filters out any technical/backend error messages.
 */
const getFriendlyMessage = (error) => {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message;

    // If the backend sent a clean user-friendly message, use it
    if (backendMessage && !looksLikeTechnicalError(backendMessage)) {
        return backendMessage;
    }

    // Otherwise, use our status-code-based fallback
    if (status && FRIENDLY_MESSAGES[status]) {
        return FRIENDLY_MESSAGES[status];
    }

    // Generic fallback
    return 'Something went wrong. Please try again.';
};

/**
 * Checks if an error message looks like a technical/backend error
 * that shouldn't be shown directly to users.
 */
const looksLikeTechnicalError = (message) => {
    if (!message || typeof message !== 'string') return true;
    const technicalPatterns = [
        /stack/i,
        /at\s+\w+\s*\(/,           // stack trace lines like "at Function (..."
        /ECONNREFUSED/i,
        /ENOTFOUND/i,
        /ETIMEDOUT/i,
        /MongoError/i,
        /MongoServerError/i,
        /mongoose/i,
        /Cast to ObjectId/i,
        /CastError/i,
        /E11000/i,
        /TypeError/i,
        /ReferenceError/i,
        /SyntaxError/i,
        /Cannot read prop/i,
        /undefined is not/i,
        /null is not/i,
        /ENOMEM/i,
        /ENOENT/i,
        /Internal Server Error/i,
        /statusCode/i,
        /\bnode_modules\b/i,
    ];
    return technicalPatterns.some((pattern) => pattern.test(message));
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                localStorage.setItem('token', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
                processQueue(null, accessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Show user-friendly toast for all non-cancelled errors
        if (error.code !== 'ERR_CANCELED') {
            const friendlyMsg = getFriendlyMessage(error);
            toast.error(friendlyMsg);
        }

        // Create a clean error object for components to use
        const friendlyMsg = getFriendlyMessage(error);
        const err = new Error(friendlyMsg);
        err.response = error.response;
        err.status = error.response?.status;
        return Promise.reject(err);
    }
);

export default api;
