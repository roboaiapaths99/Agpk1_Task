const mongoose = require('mongoose');
const logger = require('../core/logger');

/**
 * Executes a callback inside a MongoDB transaction.
 * Automatically starts a session, begins a transaction, commits on success,
 * and aborts on failure.
 *
 * Usage:
 *   const result = await withTransaction(async (session) => {
 *       await Model.updateOne({ _id }, data, { session });
 *       await OtherModel.deleteMany({ ref: _id }, { session });
 *       return someResult;
 *   });
 *
 * @param {Function} callback - Async function receiving the session
 * @returns {*} The return value of the callback
 */
async function withTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        logger.error('Transaction aborted:', { error: error.message });
        throw error;
    } finally {
        session.endSession();
    }
}

module.exports = { withTransaction };
