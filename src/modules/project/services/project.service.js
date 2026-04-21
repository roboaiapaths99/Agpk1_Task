const { Project, Milestone, Dependency } = require('../models/Project');
const Task = require('../../work-item/models/Task');
const { NotFoundError } = require('../../../core/errors');
const eventBus = require('../../../core/eventBus');
const { EVENTS } = require('../../../utils/constants');

class ProjectService {
    async create(data, userId, organizationId) {
        const project = await Project.create({ ...data, owner: userId, organizationId });
        await eventBus.publish(EVENTS.PROJECT_CREATED, {
            projectId: project._id,
            organizationId,
            name: project.name,
            owner: userId
        });
        return project;
    }

    async getAll(organizationId, query = {}) {
        const f = { organizationId };
        if (query.status) f.status = query.status;
        return Project.find(f).populate('owner', 'name email').populate('members', 'name email');
    }

    async getById(id, organizationId) {
        const p = await Project.findOne({ _id: id, organizationId }).populate('owner', 'name').populate('members', 'name email');
        if (!p) throw new NotFoundError('Project');
        return p;
    }

    async update(id, organizationId, data) {
        const p = await Project.findOneAndUpdate({ _id: id, organizationId }, data, { new: true });
        if (!p) throw new NotFoundError('Project');
        return p;
    }

    async delete(id, organizationId) {
        const p = await Project.findOneAndDelete({ _id: id, organizationId });
        if (!p) throw new NotFoundError('Project');
        await Promise.all([
            Milestone.deleteMany({ projectId: id, organizationId }),
            Dependency.deleteMany({ projectId: id, organizationId })
        ]);
        return p;
    }

    // ======================== MILESTONES ========================

    async addMilestone(projectId, organizationId, data) {
        const project = await Project.findOne({ _id: projectId, organizationId });
        if (!project) throw new NotFoundError('Project');
        return Milestone.create({ ...data, projectId, organizationId });
    }

    async getMilestones(projectId, organizationId) {
        return Milestone.find({ projectId, organizationId }).populate('tasks', 'title status');
    }

    async updateMilestone(id, organizationId, data) {
        const m = await Milestone.findOneAndUpdate({ _id: id, organizationId }, data, { new: true });
        if (!m) throw new NotFoundError('Milestone');
        return m;
    }

    // ======================== DEPENDENCIES ========================

    async addDependency(projectId, organizationId, data) {
        const project = await Project.findOne({ _id: projectId, organizationId });
        if (!project) throw new NotFoundError('Project');
        return Dependency.create({ ...data, projectId, organizationId });
    }

    async getDependencies(projectId, organizationId) {
        return Dependency.find({ projectId, organizationId }).populate('predecessor', 'title status').populate('successor', 'title status');
    }

    async removeDependency(id, organizationId) {
        return Dependency.findOneAndDelete({ _id: id, organizationId });
    }

    // ======================== VIEWS & STATS ========================

    async getGantt(projectId, organizationId) {
        const [tasks, deps] = await Promise.all([
            Task.find({ project: projectId, organizationId })
                .select('title status startDate dueDate assignee parent dependencies priority key')
                .populate('assignee', 'name')
                .lean(),
            Dependency.find({ projectId, organizationId }).lean(),
        ]);
        return { tasks, dependencies: deps };
    }

    async updateProgress(projectId, organizationId) {
        const tasks = await Task.find({ project: projectId, organizationId });
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        await Project.findOneAndUpdate({ _id: projectId, organizationId }, { progress });
        return progress;
    }
}

module.exports = new ProjectService();
