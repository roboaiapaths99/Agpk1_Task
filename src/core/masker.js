/**
 * List of sensitive keys that should be masked in logs.
 */
const SENSITIVE_KEYS = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'authorization',
    'cookie',
    'cvv',
    'creditCard',
    'ssn',
];

/**
 * Recursively masks sensitive fields in an object without mutating the original,
 * while preserving internal Symbol properties.
 * @param {any} data 
 * @param {WeakSet} visited - Used to prevent circular dependency crashes
 * @returns {any}
 */
/**
 * Recursively masks sensitive fields in an object in-place,
 * preserving internal Symbol properties and object identity for Winston compatibility.
 * @param {any} data 
 * @param {WeakSet} visited - Used to prevent circular dependency crashes
 * @returns {any}
 */
const maskData = (data, visited = new WeakSet()) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    if (visited.has(data)) {
        return data; // Return as is to avoid recursion, but don't replace with string to keep obj structure
    }
    visited.add(data);

    if (Array.isArray(data)) {
        data.forEach((item, index) => {
            data[index] = maskData(item, visited);
        });
        return data;
    }

    for (const key of Object.keys(data)) {
        const value = data[key];
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
            data[key] = '***MASKED***';
        } else if (value && typeof value === 'object') {
            maskData(value, visited);
        }
    }

    return data;
};

module.exports = { maskData };
