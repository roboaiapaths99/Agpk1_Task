/**
 * Catch Async Middleware
 * Wraps an async function and catches any errors, passing them to next()
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;
