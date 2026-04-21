const { AsyncLocalStorage } = require('node:async_hooks');

/**
 * Tenant Context — uses AsyncLocalStorage to propagate organizationId
 * from the Express request to the Mongoose query layer without
 * modifying any service method signatures.
 */
const tenantStorage = new AsyncLocalStorage();

/**
 * Express middleware: sets organizationId into AsyncLocalStorage
 * for the duration of the request. Must run AFTER `authenticate`.
 */
const tenantContext = (req, res, next) => {
    const orgId = req.user?.organizationId || null;
    tenantStorage.run({ organizationId: orgId }, () => next());
};

/**
 * Get the current organization ID from the async context.
 * @returns {string|null}
 */
const getCurrentOrgId = () => {
    const store = tenantStorage.getStore();
    return store?.organizationId || null;
};

module.exports = { tenantContext, getCurrentOrgId, tenantStorage };
