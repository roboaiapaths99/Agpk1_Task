const Task = require('../../work-item/models/Task');
const TimeLog = require('../../time-tracking/models/TimeLog');
const mongoose = require('mongoose');

class ReportingService {
    async getWorkloadAnalysis(organizationId) {
        return Task.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
            {
                $group: {
                    _id: '$assignee',
                    totalTasks: { $sum: 1 },
                    completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    criticalTasks: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
                    estimatedHours: { $sum: '$estimatedHours' }
                }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$user.name', 'Unassigned'] }, totalTasks: 1, completedTasks: 1, criticalTasks: 1, estimatedHours: 1 } }
        ]);
    }

    async getSLAPerformance(organizationId) {
        return Task.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    slaDeadline: { $exists: true }
                }
            },
            {
                $project: {
                    breached: {
                        $cond: [
                            {
                                $and: [
                                    { $gt: ['$completedAt', '$slaDeadline'] },
                                    { $eq: ['$status', 'completed'] }
                                ]
                            },
                            1,
                            { $cond: [{ $and: [{ $lt: ['$slaDeadline', new Date()] }, { $ne: ['$status', 'completed'] }] }, 1, 0] }
                        ]
                    },
                    onTime: {
                        $cond: [
                            {
                                $and: [
                                    { $lte: ['$completedAt', '$slaDeadline'] },
                                    { $eq: ['$status', 'completed'] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            },
            { $group: { _id: null, total: { $sum: 1 }, totalBreached: { $sum: '$breached' }, totalOnTime: { $sum: '$onTime' } } }
        ]);
    }

    async getTimeBurnReport(projectId, organizationId) {
        return TimeLog.aggregate([
            { $lookup: { from: 'tasks', localField: 'taskId', foreignField: '_id', as: 'task' } },
            { $unwind: '$task' },
            {
                $match: {
                    'task.project': new mongoose.Types.ObjectId(projectId),
                    'task.organizationId': new mongoose.Types.ObjectId(organizationId)
                }
            },
            { $group: { _id: '$taskId', taskTitle: { $first: '$task.title' }, totalMinutes: { $sum: '$duration' } } }
        ]);
    }

    async getBottleneckAnalysis(organizationId) {
        return Task.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    status: { $in: ['blocked', 'waiting_input', 'escalated'] }
                }
            },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
    }

    async getDashboardSummary(organizationId) {
        const totalActive = await Task.countDocuments({ organizationId, status: { $ne: 'completed' } });
        const completedTasks = await Task.countDocuments({ organizationId, status: 'completed' });
        const totalTasks = await Task.countDocuments({ organizationId });

        const timeLogs = await TimeLog.aggregate([
            { $lookup: { from: 'tasks', localField: 'taskId', foreignField: '_id', as: 'task' } },
            { $unwind: '$task' },
            { $match: { 'task.organizationId': new mongoose.Types.ObjectId(organizationId) } },
            { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
        ]);
        const totalHours = timeLogs.length > 0 ? (timeLogs[0].totalMinutes / 60).toFixed(1) : 0;

        const sla = await this.getSLAPerformance(organizationId);
        const compliance = sla.length > 0 && sla[0].total > 0 ? Math.round((sla[0].totalOnTime / sla[0].total) * 100) : 100;

        const weeklyTrend = await this.getWeeklyTrend(organizationId);

        return {
            totalActive,
            totalHours,
            compliance,
            totalTasks,
            completedTasks,
            weeklyTrend
        };
    }

    async getWeeklyTrend(organizationId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trend = await Task.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = days[d.getDay()];
            const match = trend.find(t => t._id === dateStr);
            result.push({ name: dayName, tasks: match ? match.count : 0 });
        }
        return result;
    }
}


module.exports = new ReportingService();
