const express = require('express');
const router = express.Router();
const searchService = require('../services/search.service');
const { authenticate } = require('../../../middlewares/auth');
const { success } = require('../../../utils/response');

router.use(authenticate);

router.get('/global', async (req, res, next) => {
    try {
        const results = await searchService.globalSearch(req.query.q, req.user.organizationId, req.user.id);
        return success(res, results);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
