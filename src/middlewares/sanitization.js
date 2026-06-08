/**
 * Recursive sanitizer for objects and strings to protect against basic XSS.
 * @param {any} input 
 * @returns {any}
 */
const sanitize = (input, keyName = null) => {
    // Skip sanitizing password and token fields
    const skipKeys = ['password', 'confirmPassword', 'token', 'refreshToken', 'accessToken', 'passwordResetToken', 'emailVerificationToken'];
    if (keyName && skipKeys.some(skipKey => keyName.toLowerCase().includes(skipKey))) {
        return input;
    }

    if (typeof input === 'string') {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/`/g, '&#96;');
    }

    if (Array.isArray(input)) {
        return input.map(item => sanitize(item, keyName));
    }

    if (typeof input === 'object' && input !== null) {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(input)) {
            sanitizedObj[key] = sanitize(value, key);
        }
        return sanitizedObj;
    }

    return input;
};

/**
 * Global middleware for sanitizing req.body, req.query, and req.params.
 */
const xssSanitizer = (req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) {
        const sanitizedQuery = sanitize({ ...req.query });
        for (const key of Object.keys(req.query)) {
            delete req.query[key];
        }
        Object.assign(req.query, sanitizedQuery);
    }
    if (req.params) req.params = sanitize(req.params);
    next();
};

module.exports = { xssSanitizer };
