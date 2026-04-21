const Capacity = require('../models/Capacity');
const Task = require('../../work-item/models/Task');
const User = require('../../auth/models/User');
const mongoose = require('mongoose');

class ResourceService {
    getWeekStart(date) {
        const d = new Date(date || Date.now());
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    async getTeamCapacity(organizationId, weekStart) {
        const weekDate = this.getWeekStart(weekStart);

        // Get all users in org
        const users = await User.find({ organizationId }).select('name email avatar role').lean();

        const capacities = await Promise.all(
            users.map(async (user) => {
                let cap = await Capacity.findOne({ userId: user._id, weekStartDate: weekDate })
                    .lean({ virtuals: true });

                if (!cap) {
                    // Calculate allocated hours from tasks
                    const allocatedHours = await this.calculateAllocatedHours(user._id, weekDate);
                    cap = {
                        userId: user._id,
                        weekStartDate: weekDate,
                        maxHours: 40,
                        allocatedHours,
                        timeOff: [],
                        skills: [],
                        availableHours: Math.max(40 - allocatedHours, 0),
                        utilization: Math.round((allocatedHours / 40) * 100),
                    };
                }

                return { ...cap, user };
            })
        );

        return capacities;
    }

    async calculateAllocatedHours(userId, weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const tasks = await Task.find({
            assignee: userId,
            status: { $nin: ['completed', 'done', 'closed', 'cancelled'] },
            $or: [
                { dueDate: { $gte: weekStart, $lt: weekEnd } },
                { startDate: { $gte: weekStart, $lt: weekEnd } },
                { dueDate: { $gte: weekStart }, startDate: { $lt: weekEnd } },
            ],
        }).select('estimatedHours storyPoints').lean();

        return tasks.reduce((sum, t) => sum + (t.estimatedHours || t.storyPoints || 2), 0);
    }

    async setCapacity(userId, weekStart, data, organizationId) {
        const weekDate = this.getWeekStart(weekStart);
        const allocatedHours = await this.calculateAllocatedHours(userId, weekDate);

        const cap = await Capacity.findOneAndUpdate(
            { userId, weekStartDate: weekDate },
            {
                userId,
                weekStartDate: weekDate,
                maxHours: data.maxHours || 40,
                allocatedHours,
                timeOff: data.timeOff || [],
                skills: data.skills || [],
                organizationId,
            },
            { upsert: true, new: true }
        ).lean({ virtuals: true });

        return cap;
    }

    async addTimeOff(userId, dates, organizationId) {
        const results = [];
        for (const d of dates) {
            const weekDate = this.getWeekStart(d.date);
            const cap = await Capacity.findOneAndUpdate(
                { userId, weekStartDate: weekDate, organizationId },
                { $push: { timeOff: d }, organizationId, userId, weekStartDate: weekDate },
                { upsert: true, new: true }
            );
            results.push(cap);
        }
        return results;
    }

    async suggestReassignment(taskId, organizationId) {
        const task = await Task.findById(taskId).lean();
        if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });

        const weekDate = this.getWeekStart();
        const teamCapacities = await this.getTeamCapacity(organizationId, weekDate);

        // Sort by most available hours (descending)
        const candidates = teamCapacities
            .filter(c => c.user._id.toString() !== task.assignee?.toString())
            .sort((a, b) => (b.availableHours || 0) - (a.availableHours || 0));

        return candidates.slice(0, 3).map(c => ({
            user: c.user,
            availableHours: c.availableHours,
            utilization: c.utilization,
        }));
    }
}

module.exports = new ResourceService();
