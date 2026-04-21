const TimeLog = require('../models/TimeLog');
const Task = require('../../work-item/models/Task');
const { NotFoundError, ValidationError } = require('../../../core/errors');

class TimeTrackingService {
    async startTimer(taskId, userId, organizationId, description = '') {
        const activeTimer = await TimeLog.findOne({ userId, organizationId, status: 'active' });
        if (activeTimer) throw new ValidationError('You already have an active timer running');

        return TimeLog.create({ taskId, userId, organizationId, startTime: new Date(), description, status: 'active' });
    }

    async stopTimer(userId, organizationId) {
        const timer = await TimeLog.findOne({ userId, organizationId, status: 'active' });
        if (!timer) throw new NotFoundError('Active timer');

        timer.endTime = new Date();
        timer.duration = Math.round((timer.endTime - timer.startTime) / 60000); // duration in minutes
        timer.status = 'completed';
        await timer.save();

        // Update total time on task
        await Task.findOneAndUpdate({ _id: timer.taskId, organizationId }, { $inc: { actualHours: timer.duration / 60 } });

        return timer;
    }

    async getMyLogs(userId, organizationId, query = {}) {
        const f = { userId, organizationId };
        if (query.taskId) f.taskId = query.taskId;
        return TimeLog.find(f).populate('taskId', 'title priority').sort('-createdAt');
    }

    async getTaskLogs(taskId, organizationId) {
        return TimeLog.find({ taskId, organizationId }).populate('userId', 'name email').sort('-createdAt');
    }

    async getActiveTimer(userId, organizationId) {
        return TimeLog.findOne({ userId, organizationId, status: 'active' }).populate('taskId', 'title priority key');
    }

    async addManualEntry(data, userId, organizationId) {
        const { taskId, startTime, endTime, description, isBillable } = data;
        const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);
        const log = await TimeLog.create({ taskId, userId, organizationId, startTime, endTime, duration, description, isBillable, status: 'completed' });
        await Task.findOneAndUpdate({ _id: taskId, organizationId }, { $inc: { actualHours: duration / 60 } });
        return log;
    }
}

module.exports = new TimeTrackingService();
