const TaxConfig = require('../models/TaxConfig');
const { AppError } = require('../../../../core/errors');

class TaxService {
    async createTaxConfig(data, organizationId) {
        const taxConfig = await TaxConfig.create({
            ...data,
            organizationId
        });
        return taxConfig;
    }

    async getActiveTaxConfigs(organizationId) {
        return await TaxConfig.find({ organizationId, isActive: true });
    }

    /**
     * Calculate tax for an amount based on tax configuration name
     */
    async calculateTax(amount, taxConfigId, organizationId) {
        const config = await TaxConfig.findOne({ _id: taxConfigId, organizationId });
        if (!config) throw new AppError('Tax configuration not found', 404);

        const taxAmount = (amount * config.rate) / 100;
        return {
            taxAmount,
            rate: config.rate,
            name: config.name
        };
    }

    /**
     * Helper to get total amount including tax
     */
    calculateTotal(subtotal, taxAmount) {
        return subtotal + taxAmount;
    }

    async updateTaxConfig(id, data, organizationId) {
        const config = await TaxConfig.findOneAndUpdate(
            { _id: id, organizationId },
            data,
            { new: true, runValidators: true }
        );
        if (!config) throw new AppError('Tax configuration not found', 404);
        return config;
    }

    async deleteTaxConfig(id, organizationId) {
        const config = await TaxConfig.findOneAndUpdate(
            { _id: id, organizationId },
            { isActive: false },
            { new: true }
        );
        if (!config) throw new AppError('Tax configuration not found', 404);
        return config;
    }

    async getTaxAuditHistory(organizationId) {
        const configs = await TaxConfig.find({ organizationId }).sort('-updatedAt').limit(50);
        return configs.map(config => {
            const isCreated = config.createdAt.getTime() === config.updatedAt.getTime();
            return {
                _id: `${config._id}-${config.updatedAt.getTime()}`,
                action: isCreated ? 'CREATE' : 'UPDATE',
                entity: 'TaxConfig',
                details: `Tax nexus '${config.name}' was ${isCreated ? 'created' : 'modified'}. Rate: ${config.rate}%`,
                timestamp: config.updatedAt,
                user: "System" // Uses System since we don't have user object attached to model
            };
        });
    }
}

module.exports = new TaxService();
