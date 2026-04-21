/**
 * Pagination Helper
 * Usage: const { query, pagination } = paginate(req.query);
 */

const paginate = (queryParams = {}) => {
    const page = Math.max(parseInt(queryParams.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(queryParams.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const sort = queryParams.sort || '-createdAt';

    return {
        skip,
        limit,
        page,
        sort,
    };
};

const paginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

module.exports = { paginate, paginationMeta };
