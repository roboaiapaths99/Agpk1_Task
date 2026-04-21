const Task = require('../../work-item/models/Task');

class HealthService {
    async getTeamScore() {
        const tasks = await Task.find({});
        const completed = tasks.filter(t => t.status === 'completed').length;
        const breached = tasks.filter(t => t.slaBreached).length;

        const baseScore = 100;
        const completionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 100;
        const penalty = (breached * 5);

        return {
            score: Math.max(0, Math.min(100, Math.round((completionRate + baseScore) / 2 - penalty))),
            metrics: { totalTasks: tasks.length, completed, breached }
        };
    }
}

module.exports = new HealthService();
