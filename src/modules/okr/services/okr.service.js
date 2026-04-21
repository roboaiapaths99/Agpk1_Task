const Objective = require('../models/Objective');
const KeyResult = require('../models/KeyResult');
const Task = require('../../work-item/models/Task');
const mongoose = require('mongoose');

class OKRService {
    // ─── Objectives ─────────────────────────────────────────
    async createObjective(data) {
        const objective = await Objective.create(data);
        return objective;
    }

    async getObjectives({ organizationId, period, level, owner }) {
        const filter = { organizationId };
        if (period) filter.period = period;
        if (level) filter.level = level;
        if (owner) filter.owner = new mongoose.Types.ObjectId(owner);

        const objectives = await Objective.find(filter)
            .populate('owner', 'name email avatar')
            .populate({
                path: 'keyResults',
                populate: [
                    { path: 'owner', select: 'name avatar' },
                    { path: 'linkedTasks', select: 'title key status' },
                ],
            })
            .populate({
                path: 'childObjectives',
                select: 'title status progress level',
                populate: { path: 'owner', select: 'name avatar' },
            })
            .sort({ level: 1, createdAt: -1 })
            .lean({ virtuals: true });

        return objectives;
    }

    async getObjectiveById(id, organizationId) {
        const obj = await Objective.findOne({ _id: id, organizationId })
            .populate('owner', 'name email avatar')
            .populate({
                path: 'keyResults',
                populate: [
                    { path: 'owner', select: 'name avatar' },
                    { path: 'linkedTasks', select: 'title key status priority' },
                    { path: 'linkedProjects', select: 'name' },
                ],
            })
            .populate({
                path: 'childObjectives',
                populate: { path: 'owner', select: 'name avatar' },
            })
            .lean({ virtuals: true });

        if (!obj) throw Object.assign(new Error('Objective not found'), { statusCode: 404 });
        return obj;
    }

    async updateObjective(id, updates, organizationId) {
        delete updates.organizationId;
        const obj = await Objective.findOneAndUpdate(
            { _id: id, organizationId },
            updates,
            { new: true, runValidators: true }
        );
        if (!obj) throw Object.assign(new Error('Objective not found'), { statusCode: 404 });
        return obj;
    }

    async deleteObjective(id, organizationId) {
        // Delete objective and its key results
        await KeyResult.deleteMany({ objectiveId: id, organizationId });
        const obj = await Objective.findOneAndDelete({ _id: id, organizationId });
        if (!obj) throw Object.assign(new Error('Objective not found'), { statusCode: 404 });
        return { success: true };
    }

    // ─── Key Results ────────────────────────────────────────
    async createKeyResult(data) {
        // Verify objective exists
        const obj = await Objective.findOne({ _id: data.objectiveId, organizationId: data.organizationId });
        if (!obj) throw Object.assign(new Error('Objective not found'), { statusCode: 404 });

        const kr = await KeyResult.create(data);

        // Recalculate objective progress
        await this.recalculateObjectiveProgress(data.objectiveId, data.organizationId);

        return kr;
    }

    async updateKeyResult(id, updates, organizationId) {
        delete updates.organizationId;
        const kr = await KeyResult.findOneAndUpdate(
            { _id: id, organizationId },
            updates,
            { new: true, runValidators: true }
        ).lean({ virtuals: true });

        if (!kr) throw Object.assign(new Error('Key Result not found'), { statusCode: 404 });

        // Recalculate parent objective progress
        await this.recalculateObjectiveProgress(kr.objectiveId, organizationId);

        return kr;
    }

    async deleteKeyResult(id, organizationId) {
        const kr = await KeyResult.findOneAndDelete({ _id: id, organizationId });
        if (!kr) throw Object.assign(new Error('Key Result not found'), { statusCode: 404 });
        await this.recalculateObjectiveProgress(kr.objectiveId, organizationId);
        return { success: true };
    }

    async linkTasksToKeyResult(krId, taskIds, organizationId) {
        const kr = await KeyResult.findOneAndUpdate(
            { _id: krId, organizationId },
            { $addToSet: { linkedTasks: { $each: taskIds } } },
            { new: true }
        );
        if (!kr) throw Object.assign(new Error('Key Result not found'), { statusCode: 404 });

        // Auto-recalculate progress from task completion
        await this.recalculateKRFromTasks(krId, organizationId);

        return kr;
    }

    // ─── Progress Calculation ───────────────────────────────
    async recalculateObjectiveProgress(objectiveId, organizationId) {
        const keyResults = await KeyResult.find({ objectiveId, organizationId }).lean({ virtuals: true });

        if (keyResults.length === 0) {
            await Objective.findByIdAndUpdate(objectiveId, { progress: 0 });
            return;
        }

        const avgProgress = keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) / keyResults.length;
        const roundedProgress = Math.round(avgProgress);

        // Auto-set status based on progress
        let status = 'on_track';
        if (roundedProgress >= 100) status = 'completed';
        else if (roundedProgress < 30) status = 'behind';
        else if (roundedProgress < 60) status = 'at_risk';

        await Objective.findByIdAndUpdate(objectiveId, { progress: roundedProgress, status });
    }

    async recalculateKRFromTasks(krId, organizationId) {
        const kr = await KeyResult.findOne({ _id: krId, organizationId });
        if (!kr || kr.linkedTasks.length === 0) return;

        // Count completed linked tasks
        const completedCount = await Task.countDocuments({
            _id: { $in: kr.linkedTasks },
            status: { $in: ['completed', 'done', 'closed'] },
        });

        const totalCount = kr.linkedTasks.length;

        // Update currentValue proportionally
        const progressRatio = completedCount / totalCount;
        const newValue = Math.round(kr.startValue + (kr.targetValue - kr.startValue) * progressRatio);

        await KeyResult.findByIdAndUpdate(krId, { currentValue: newValue });

        // Cascade: recalculate parent objective
        await this.recalculateObjectiveProgress(kr.objectiveId, organizationId);
    }

    // ─── Dashboard Aggregation ──────────────────────────────
    async getDashboard(organizationId, period) {
        const objectives = await this.getObjectives({ organizationId, period });

        const stats = {
            total: objectives.length,
            onTrack: objectives.filter(o => o.status === 'on_track').length,
            atRisk: objectives.filter(o => o.status === 'at_risk').length,
            behind: objectives.filter(o => o.status === 'behind').length,
            completed: objectives.filter(o => o.status === 'completed').length,
            avgProgress: objectives.length ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length) : 0,
        };

        // Group by level for hierarchy view
        const byLevel = {
            company: objectives.filter(o => o.level === 'company'),
            department: objectives.filter(o => o.level === 'department'),
            team: objectives.filter(o => o.level === 'team'),
            individual: objectives.filter(o => o.level === 'individual'),
        };

        return { stats, byLevel, objectives };
    }
}

module.exports = new OKRService();
