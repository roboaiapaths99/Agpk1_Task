const eventBus = require('../../../../core/eventBus');
const { EVENTS } = require('../../../../utils/constants');
const budgetService = require('../services/budget.service');
const logger = require('../../../../core/logger');

/**
 * Budget Event Subscriber
 * Automatically synchronizes budget spent amounts when expenses change.
 */
const initBudgetSubscriber = () => {
    // 1. Expense Added -> Increment matching budgets
    eventBus.subscribe(EVENTS.EXPENSE_ADDED, async (data) => {
        try {
            const { amount, category, date, organizationId } = data;
            
            await budgetService.adjustSpentAmount({
                organizationId,
                category,
                date,
                amount: amount
            });

            logger.info(`Budget sync: Added ₹${amount} to matching budgets for ${category}`);
        } catch (error) {
            logger.error(`Budget-Expense Added sync error: ${error.message}`);
        }
    });

    // 2. Expense Updated -> Adjust budgets based on diff
    eventBus.subscribe(EVENTS.EXPENSE_UPDATED, async (data) => {
        try {
            const { 
                oldAmount, newAmount, 
                oldCategory, newCategory, 
                oldDate, newDate, 
                organizationId 
            } = data;

            // Step A: Reverse the old expense effect
            await budgetService.adjustSpentAmount({
                organizationId,
                category: oldCategory,
                date: oldDate,
                amount: -oldAmount
            });

            // Step B: Apply the new expense effect
            await budgetService.adjustSpentAmount({
                organizationId,
                category: newCategory,
                date: newDate,
                amount: newAmount
            });

            logger.info(`Budget sync: Updated expense, adjusted matching budgets (Before: ₹${oldAmount}, After: ₹${newAmount})`);
        } catch (error) {
            logger.error(`Budget-Expense Updated sync error: ${error.message}`);
        }
    });

    // 3. Expense Deleted -> Decrement matching budgets
    eventBus.subscribe(EVENTS.EXPENSE_DELETED, async (data) => {
        try {
            const { amount, category, date, organizationId } = data;

            await budgetService.adjustSpentAmount({
                organizationId,
                category,
                date,
                amount: -amount
            });

            logger.info(`Budget sync: Reverted ₹${amount} from matching budgets for deleted expense`);
        } catch (error) {
            logger.error(`Budget-Expense Deleted sync error: ${error.message}`);
        }
    });
};

module.exports = initBudgetSubscriber;
