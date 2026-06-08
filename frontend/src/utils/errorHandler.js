/**
 * API Error Handler & Recovery
 * Standardizes error handling across the application
 * Provides retry logic and user-friendly messages
 */

import toast from 'react-hot-toast';

const ERROR_MESSAGES = {
    // Network errors
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    CONNECTION_REFUSED: 'Cannot connect to server. Please try again later.',
    
    // Auth errors
    UNAUTHORIZED: 'Session expired. Please log in again.',
    FORBIDDEN: 'You don\'t have permission to access this.',
    INVALID_TOKEN: 'Invalid authentication token.',
    
    // Validation errors
    VALIDATION_FAILED: 'Please check your input and try again.',
    INVALID_REQUEST: 'Invalid request format.',
    
    // Server errors
    SERVER_ERROR: 'Server error. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
    NOT_FOUND: 'Resource not found.',
    CONFLICT: 'This resource already exists.',
    
    // Default
    UNKNOWN: 'An unexpected error occurred. Please try again.'
};

/**
 * Parse error response and return user-friendly message
 */
export const getErrorMessage = (error) => {
    try {
        // Axios error
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            // Try to get specific error message from server
            if (data?.message) return data.message;
            if (data?.error) return data.error;
            
            // Fall back to status-based messages
            switch (status) {
                case 400:
                    return ERROR_MESSAGES.VALIDATION_FAILED;
                case 401:
                    return ERROR_MESSAGES.UNAUTHORIZED;
                case 403:
                    return ERROR_MESSAGES.FORBIDDEN;
                case 404:
                    return ERROR_MESSAGES.NOT_FOUND;
                case 409:
                    return ERROR_MESSAGES.CONFLICT;
                case 422:
                    return ERROR_MESSAGES.VALIDATION_FAILED;
                case 429:
                    return 'Too many requests. Please wait a moment.';
                case 500:
                case 502:
                case 503:
                    return ERROR_MESSAGES.SERVER_ERROR;
                case 504:
                    return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
                default:
                    return ERROR_MESSAGES.UNKNOWN;
            }
        }

        // Network error
        if (error.code === 'ECONNABORTED') {
            return ERROR_MESSAGES.TIMEOUT;
        }

        if (error.message === 'Network Error') {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }

        // Custom error
        if (error.message) {
            return error.message;
        }

        return ERROR_MESSAGES.UNKNOWN;
    } catch (err) {
        console.error('[ErrorHandler] Error parsing error:', err);
        return ERROR_MESSAGES.UNKNOWN;
    }
};

/**
 * Retry logic with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            const isRetryable = isRetryableError(error);
            if (!isRetryable || attempt === maxRetries - 1) {
                throw error;
            }

            // Exponential backoff
            const backoffDelay = delay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
    }

    throw lastError;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
    // Network errors
    if (!error.response) return true;

    const status = error.response.status;

    // Retry on: timeout, rate limit, server errors, service unavailable
    return status === 408 || 
           status === 429 || 
           status === 500 || 
           status === 502 || 
           status === 503 || 
           status === 504;
};

/**
 * Handle API error with logging and notification
 */
export const handleApiError = (error, options = {}) => {
    const {
        showToast = true,
        logToConsole = true,
        context = 'API Call',
        onRetry = null,
        silent = false
    } = options;

    if (logToConsole) {
        console.error(`[${context}] Error:`, error);
    }

    if (silent) return;

    const message = getErrorMessage(error);

    if (showToast) {
        if (error.response?.status === 401) {
            // Auth error - store for potential retry after login
            toast.error(message);
            // Could trigger logout here
        } else if (error.response?.status >= 500) {
            toast.error(message);
        } else {
            toast.error(message);
        }
    }

    return {
        message,
        error,
        isRetryable: isRetryableError(error),
        statusCode: error.response?.status
    };
};

/**
 * Check if error is auth-related
 */
export const isAuthError = (error) => {
    return error.response?.status === 401 || 
           error.response?.status === 403 ||
           error.message?.includes('Unauthorized') ||
           error.message?.includes('token');
};

/**
 * Check if error is network-related
 */
export const isNetworkError = (error) => {
    return !error.response || 
           error.code === 'ECONNABORTED' ||
           error.message === 'Network Error' ||
           error.message === 'timeout of';
};

export default {
    getErrorMessage,
    retryWithBackoff,
    isRetryableError,
    handleApiError,
    isAuthError,
    isNetworkError,
    ERROR_MESSAGES
};
