const express = require('express');
const router = express.Router();
const searchService = require('../services/search.service');
const { authenticate } = require('../../../middlewares/auth');

router.get('/', authenticate, async (req, res) => {
    try {
        const { q } = req.query;
        const results = await searchService.globalSearch(q, req.user.id, req.user.organizationId);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
