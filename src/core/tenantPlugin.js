const { getCurrentOrgId } = require('../middlewares/tenantContext');

/**
 * Mongoose Plugin for Automated Multi-Tenancy
 * Automatically injects organizationId into queries to prevent data leakage.
 */
function tenantPlugin(schema, options = {}) {
    // Add organizationId field if it doesn't exist (most models already have it)
    if (!schema.path('organizationId')) {
        schema.add({
            organizationId: {
                type: 'ObjectId',
                ref: 'Organization',
                required: true,
                index: true
            }
        });
    }

    // List of query methods to intercept
    const queries = [
        'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
        'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
        'count', 'countDocuments', 'aggregate'
    ];

    queries.forEach(method => {
        schema.pre(method, function (next) {
            const orgId = getCurrentOrgId();

            // Bypass if no orgId in context (e.g., system tasks, migrations, or public routes)
            // Or if explicitly requested to bypass (e.g., { bypassTenant: true })
            const options = typeof this.getOptions === 'function' ? this.getOptions() : (this.options || {});
            if (!orgId || options.bypassTenant) {
                return next();
            }

            // Inject organizationId into the query/filter
            if (method === 'aggregate') {
                // For aggregation, we must add a $match stage as the first stage
                // Ensure orgId is cast to ObjectId for aggregation stages
                const mongoose = require('mongoose');
                const targetOrgId = mongoose.Types.ObjectId.isValid(orgId) 
                    ? new mongoose.Types.ObjectId(orgId) 
                    : orgId;
                
                this.pipeline().unshift({ $match: { organizationId: targetOrgId } });
            } else {
                this.where({ organizationId: orgId });
            }

            next();
        });
    });

    // Ensure organizationId is always set on save/create
    schema.pre('save', function (next) {
        const orgId = getCurrentOrgId();
        if (orgId && !this.organizationId) {
            this.organizationId = orgId;
        }
        next();
    });
}

module.exports = tenantPlugin;
