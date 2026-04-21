const taxService = require('../services/tax.service');
const logger = require('../../../../core/logger');

exports.createTaxConfig = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const config = await taxService.createTaxConfig(req.body, organizationId);
        res.status(201).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

exports.getTaxConfigs = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const configs = await taxService.getActiveTaxConfigs(organizationId);
        res.status(200).json({ success: true, data: configs });
    } catch (error) {
        next(error);
    }
};

exports.updateTaxConfig = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const config = await taxService.updateTaxConfig(req.params.id, req.body, organizationId);
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

exports.deleteTaxConfig = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        await taxService.deleteTaxConfig(req.params.id, organizationId);
        res.status(204).json({ success: true, data: null });
    } catch (error) {
        next(error);
    }
};

exports.getTaxHistory = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const history = await taxService.getTaxAuditHistory(organizationId);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

exports.calculateTax = async (req, res, next) => {
    try {
        const { amount, taxConfigId } = req.body;
        const organizationId = req.user.organizationId;
        const result = await taxService.calculateTax(amount, taxConfigId, organizationId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
