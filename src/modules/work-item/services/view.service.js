const mongoose = require('mongoose');
const Task = require('../models/Task');
const SavedView = require('../models/SavedView');
const { paginate, paginationMeta } = require('../../../utils/pagination');

class ViewService {
    async getKanbanView(organizationId, filters = {}) {
        const match = this._buildMatch(organizationId, filters);
        const result = await Task.aggregate([
            { $match: match },
            { $group: { _id: '$status', tasks: { $push: { _id: '$_id', title: '$title', key: '$key', status: '$status', priority: '$priority', assignee: '$assignee', dueDate: '$dueDate', description: '$description', issueType: '$issueType', storyPoints: '$storyPoints' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        return result;
    }

    async getCalendarView(organizationId, filters = {}) {
        const match = { ...this._buildMatch(organizationId, filters), dueDate: { $ne: null } };
        const tasks = await Task.find(match)
            .select('title status priority dueDate startDate assignee')
            .populate('assignee', 'name')
            .sort('dueDate')
            .lean();
        return tasks;
    }

    async getTimelineView(organizationId, projectId) {
        const tasks = await Task.find({ project: projectId, organizationId, isArchived: false })
            .select('title status startDate dueDate assignee parent')
            .populate('assignee', 'name')
            .sort('startDate')
            .lean();
        return tasks;
    }

    async getMyTasks(userId, organizationId, queryParams = {}) {
        const { skip, limit, page, sort } = paginate(queryParams);
        const filter = { assignee: userId, organizationId, isArchived: false };
        if (queryParams.status) filter.status = queryParams.status;

        const [tasks, total] = await Promise.all([
            Task.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            Task.countDocuments(filter),
        ]);
        return { tasks, pagination: paginationMeta(total, page, limit) };
    }

    async getOverdueTasks(organizationId, queryParams = {}) {
        const { skip, limit, page } = paginate(queryParams);
        const filter = {
            organizationId,
            dueDate: { $lt: new Date() },
            status: { $nin: ['completed', 'cancelled'] },
            isArchived: false,
        };

        const [tasks, total] = await Promise.all([
            Task.find(filter).populate('assignee', 'name email').sort('dueDate').skip(skip).limit(limit).lean(),
            Task.countDocuments(filter),
        ]);
        return { tasks, pagination: paginationMeta(total, page, limit) };
    }

    async getTeamWorkload(organizationId, queryParams = {}) {
        const orgId = new mongoose.Types.ObjectId(organizationId);
        const match = { organizationId: orgId, status: { $nin: ['completed', 'cancelled'] }, isArchived: false };
        if (queryParams.team) match.team = queryParams.team;

        const result = await Task.aggregate([
            { $match: match },
            { $group: { _id: '$assignee', totalTasks: { $sum: 1 }, highPriority: { $sum: { $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0] } } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, totalTasks: 1, highPriority: 1, userName: '$user.name', email: '$user.email' } },
            { $sort: { totalTasks: -1 } },
        ]);
        return result;
    }

    // ======================== SAVED VIEWS ========================

    async saveView(data, userId, organizationId) {
        return SavedView.create({ ...data, userId, organizationId });
    }

    async getSavedViews(userId, organizationId) {
        return SavedView.find({
            organizationId,
            $or: [{ userId }, { isShared: true }]
        }).sort('-createdAt');
    }

    async deleteSavedView(viewId, organizationId, userId) {
        return SavedView.findOneAndDelete({ _id: viewId, organizationId, userId });
    }

    _buildMatch(organizationId, filters = {}) {
        const orgId = new mongoose.Types.ObjectId(organizationId);
        const match = { organizationId: orgId, isArchived: false };
        if (filters.status) match.status = filters.status;
        if (filters.priority) match.priority = filters.priority;
        if (filters.assignee) match.assignee = filters.assignee;
        if (filters.project) match.project = filters.project;
        return match;
    }
}

module.exports = new ViewService();
