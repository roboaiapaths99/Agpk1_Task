const Task = require('../../work-item/models/Task');
const Sprint = require('../../project/models/Sprint');

/**
 * AI Forecasting Service
 * Uses simple linear regression and trend analysis to predict sprint capacity
 */
class ForecastingService {
    static async getSprintForecast(projectId, orgId) {
        // 1. Get last 5 completed sprints for velocity baseline
        const completedSprints = await Sprint.find({
            projectId,
            organizationId: orgId,
            status: 'completed'
        })
            .sort({ endDate: -1 })
            .limit(5);

        if (completedSprints.length < 2) {
            return {
                status: 'insufficient_data',
                message: 'At least 2 completed sprints are required for baseline forecasting.',
                data: {
                    completedSprints: completedSprints.length
                }
            };
        }

        // 2. Calculate velocity trend (Points per Day)
        const velocities = completedSprints.map(s => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            const durationDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
            const points = s.completedPoints || 0;
            return points / durationDays;
        }).reverse();

        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const latestVelocity = velocities[velocities.length - 1];
        const trend = latestVelocity - velocities[0];

        // Weighted prediction (50% average, 50% latest trend)
        const predictedVelocity = Math.max(0.1, (avgVelocity + latestVelocity) / 2);

        // 3. Analyze Current Sprint if active
        const currentSprint = await Sprint.findOne({
            projectId,
            organizationId: orgId,
            status: 'active'
        });

        if (!currentSprint) {
            return {
                status: 'success',
                mode: 'planning',
                forecast: {
                    predictedVelocityPerDay: predictedVelocity.toFixed(2),
                    suggested14DayCapacity: (predictedVelocity * 14).toFixed(0),
                    historicalAvg: avgVelocity.toFixed(2),
                    trendDirection: trend >= 0 ? 'improving' : 'declining'
                }
            };
        }

        // 4. Risk Analysis for Active Sprint
        const activeTasks = await Task.find({
            sprintId: currentSprint._id,
            status: { $ne: 'completed' }
        });

        const totalRemainingPoints = activeTasks.reduce((sum, t) => sum + (t.points || 0), 0);
        const daysLeft = Math.max(0, (new Date(currentSprint.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        const estimatedCapacityRemaining = predictedVelocity * daysLeft;

        const isAtRisk = totalRemainingPoints > estimatedCapacityRemaining;
        const confidence = Math.min(100, Math.max(0, (estimatedCapacityRemaining / totalRemainingPoints) * 100));

        return {
            status: 'success',
            mode: 'tracking',
            forecast: {
                currentSprintId: currentSprint._id,
                totalRemainingPoints,
                estimatedCapacityRemaining: estimatedCapacityRemaining.toFixed(1),
                daysLeft: daysLeft.toFixed(1),
                isAtRisk,
                confidenceScore: isAtRisk ? confidence.toFixed(0) : 100,
                historicalAvg: avgVelocity.toFixed(2),
                trendDirection: trend >= 0 ? 'improving' : 'declining'
            }
        };
    }
}

module.exports = ForecastingService;
