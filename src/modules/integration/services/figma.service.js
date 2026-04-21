const IntegrationConfig = require('../models/IntegrationConfig');
const { ValidationError } = require('../../../core/errors');

class FigmaService {
    /**
     * Connect Figma integration
     */
    async connect({ organizationId, apiToken, fileKey, userId }) {
        const config = await IntegrationConfig.findOneAndUpdate(
            { organizationId, provider: 'figma' },
            {
                provider: 'figma',
                organizationId,
                isActive: true,
                config: {
                    apiToken,
                    fileKey,
                },
                connectedBy: userId,
                lastSyncAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return {
            success: true,
            message: 'Figma integration activated successfully.',
            fileKey,
        };
    }

    /**
     * Disconnect Figma integration
     */
    async disconnect(organizationId) {
        await IntegrationConfig.findOneAndUpdate(
            { organizationId, provider: 'figma' },
            { isActive: false, 'config.apiToken': '' }
        );
        return { success: true };
    }

    /**
     * Get connection status
     */
    async getStatus(organizationId) {
        const config = await IntegrationConfig.findOne({ organizationId, provider: 'figma' })
            .populate('connectedBy', 'name email')
            .lean();

        if (!config) return { connected: false };

        return {
            connected: config.isActive,
            fileKey: config.config?.fileKey,
            connectedBy: config.connectedBy,
            lastSyncAt: config.lastSyncAt,
        };
    }
}

module.exports = new FigmaService();
