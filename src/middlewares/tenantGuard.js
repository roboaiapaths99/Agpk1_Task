const { getCurrentOrgId } = require('./tenantContext');

/**
 * Mongoose Plugin: Zero-Trust Tenant Guard
 * 
 * Automatically injects `organizationId` into every query for schemas
 * that have an `organizationId` field. This provides defense-in-depth
 * tenant isolation — even if a service accidentally omits the org filter,
 * data from other tenants is never returned.
 *
 * IMPORTANT: This is a safety net. Services should STILL pass organizationId
 * explicitly for clarity. This plugin only adds it if the query doesn't
 * already have one.
 */
function tenantGuardPlugin(schema) {
    // Only apply to schemas that actually have an organizationId field
    if (!schema.path('organizationId')) {
        return;
    }

    const queryHooks = [
        'find',
        'findOne',
        'findOneAndUpdate',
        'findOneAndDelete',
        'findOneAndReplace',
        'updateOne',
        'updateMany',
        'deleteOne',
        'deleteMany',
        'countDocuments',
        'estimatedDocumentCount',
    ];

    queryHooks.forEach((hookName) => {
        schema.pre(hookName, function () {
            const filter = this.getFilter ? this.getFilter() : {};

            // Skip if organizationId is already in the filter (explicit service call)
            if (filter.organizationId) {
                return;
            }

            // Get org from AsyncLocalStorage context
            const orgId = getCurrentOrgId();
            if (orgId) {
                this.where({ organizationId: orgId });
            }
        });
    });
}

module.exports = tenantGuardPlugin;
