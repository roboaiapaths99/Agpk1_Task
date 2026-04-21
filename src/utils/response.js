/**
 * Standard API Response Formatter
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        ...(data !== null && (
            (typeof data === 'object' && !Array.isArray(data)) ? data : { data }
        )),
    };
    return res.status(statusCode).json(response);
};

const created = (res, data = null, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

const paginated = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        ...(Array.isArray(data) ? { data } : data),
        pagination,
    });
};

module.exports = { success, created, paginated };
