const { Dependency } = require('../../project/models/Project');
const Task = require('../../work-item/models/Task');

class WorkGraphService {
    async getDependencyGraph(projectId) {
        const tasks = await Task.find({ project: projectId }).select('title status');
        const dependencies = await Dependency.find({ projectId });

        return {
            nodes: tasks.map(t => ({ id: t._id, label: t.title, status: t.status })),
            edges: dependencies.map(d => ({ from: d.predecessor, to: d.successor, type: d.type }))
        };
    }
}

module.exports = new WorkGraphService();
