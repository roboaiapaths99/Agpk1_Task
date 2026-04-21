const auditService = require('../services/audit.service');

exports.getLogs = async (req, res, next) => {
    try {
        const { module, action, userId, entityId, limit, skip } = req.query;
        const query = {};
        if (module) query.module = module;
        if (action) query.action = action;
        if (userId) query.userId = userId;
        if (entityId) query.entityId = entityId;

        const logs = await auditService.getLogs(query, {
            limit: parseInt(limit),
            skip: parseInt(skip)
        });

        res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        next(error);
    }
};

exports.getEntityHistory = async (req, res, next) => {
    try {
        const history = await auditService.getEntityHistory(req.params.id);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

exports.getFilters = async (req, res, next) => {
    try {
        const filters = await auditService.getFilters();
        res.json({ success: true, data: filters });
    } catch (error) {
        next(error);
    }
};

exports.exportEntityHistory = async (req, res, next) => {
    try {
        const history = await auditService.getEntityHistory(req.params.id);
        if (!history || history.length === 0) {
            return res.status(404).json({ success: false, message: 'No history found for this entity' });
        }

        const pdfService = require('../../finance/shared/services/pdf.service');
        const entityType = history[0].module; // or determine from first log
        const pdfUrl = await pdfService.generateAuditHistoryPDF(req.params.id, history, entityType);

        res.json({ success: true, url: pdfUrl });
    } catch (error) {
        next(error);
    }
};
