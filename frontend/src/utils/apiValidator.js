/**
 * API Response Validator & Sanitizer
 * Ensures all API responses have expected structure before use
 * Prevents "Cannot read property of undefined" errors
 */

const validateResponse = (response, expectedKeys = []) => {
    try {
        if (!response) {
            console.error('[API Validator] Response is null/undefined', response);
            return { data: null, error: 'No response from server' };
        }

        // If it's an axios response object
        if (response.data !== undefined) {
            const data = response.data;
            
            // Validate expected structure
            if (expectedKeys.length > 0) {
                const missing = expectedKeys.filter(key => !(key in data));
                if (missing.length > 0) {
                    console.warn(`[API Validator] Missing keys: ${missing.join(', ')}`, data);
                }
            }

            return {
                data: data || {},
                error: null,
                success: data?.success !== false
            };
        }

        // Direct object response
        return {
            data: response,
            error: null,
            success: response?.success !== false
        };
    } catch (err) {
        console.error('[API Validator] Validation error:', err);
        return { data: null, error: err.message };
    }
};

const safeGet = (obj, path, defaultValue = null) => {
    try {
        if (!obj || typeof obj !== 'object') return defaultValue;
        
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        
        return result !== undefined ? result : defaultValue;
    } catch (err) {
        return defaultValue;
    }
};

const safeArray = (arr, defaultValue = []) => {
    return Array.isArray(arr) ? arr : defaultValue;
};

const safeObject = (obj, defaultValue = {}) => {
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : defaultValue;
};

export { validateResponse, safeGet, safeArray, safeObject };
