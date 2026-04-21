const mongoose = require('mongoose');
const Invoice = require('../../invoice/models/Invoice');
const Expense = require('../../expenses/models/Expense');
const ForecastSnapshot = require('../models/ForecastSnapshot');
const logger = require('../../../../core/logger');

class ForecastingService {
    /**
     * AI-Powered Revenue Prediction (Real Implementation)
     * Uses Simple Linear Regression (Least Squares) on historical invoice data.
     */
    async generateRevenueForecast(organizationId) {
        try {
            // 1. Fetch historical monthly revenue for the last 12 months
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const history = await Invoice.aggregate([
                {
                    $match: {
                        organizationId: new mongoose.Types.ObjectId(organizationId),
                        issuedDate: { $gte: twelveMonthsAgo },
                        status: { $nin: ['cancelled', 'draft'] }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$issuedDate' },
                            month: { $month: '$issuedDate' }
                        },
                        totalRevenue: { $sum: '$totalAmount' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // 2. Prepare data for regression
            // x = month index, y = revenue
            const dataPoints = history.map((item, index) => ({
                x: index,
                y: item.totalRevenue
            }));

            let predictions = [];
            let confidence = 50;

            if (dataPoints.length >= 3) {
                // Perform Linear Regression (Least Squares)
                const n = dataPoints.length;
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                
                for (const p of dataPoints) {
                    sumX += p.x;
                    sumY += p.y;
                    sumXY += p.x * p.y;
                    sumX2 += p.x * p.x;
                }

                const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;

                // Project next 3 months
                for (let i = 1; i <= 3; i++) {
                    const nextX = dataPoints.length + i - 1;
                    const predictedValue = Math.max(0, slope * nextX + intercept);
                    
                    const nextDate = new Date();
                    nextDate.setMonth(nextDate.getMonth() + i);
                    nextDate.setDate(1); // Start of month

                    predictions.push({
                        date: nextDate,
                        value: Math.round(predictedValue)
                    });
                }
                confidence = Math.min(95, 70 + (dataPoints.length * 2)); // Increase confidence with more data
            } else {
                // Fallback: Use last month or 0 and apply 5% growth
                const lastValue = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].y : 0;
                for (let i = 1; i <= 3; i++) {
                    const nextDate = new Date();
                    nextDate.setMonth(nextDate.getMonth() + i);
                    nextDate.setDate(1);

                    predictions.push({
                        date: nextDate,
                        value: Math.round(lastValue * Math.pow(1.05, i))
                    });
                }
                confidence = 30; // Low confidence for low data
            }

            // 3. Save snapshot
            await ForecastSnapshot.create({
                type: 'revenue',
                period: 'Next 90 Days',
                predictions,
                confidence,
                organizationId,
                metadata: {
                    dataPointsUsed: dataPoints.length,
                    generatedAt: new Date()
                }
            });

            logger.info(`Real forecast generated for org ${organizationId} using ${dataPoints.length} data points`);
            return predictions;
        } catch (error) {
            logger.error(`Forecasting Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ForecastingService();
