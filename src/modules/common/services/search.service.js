const Task = require('../../work-item/models/Task');
const Project = require('../../project/models/Project');

class SearchService {
    async globalSearch(query, userId, organizationId) {
        if (!query || query.length < 2) return { tasks: [], projects: [] };

        const searchRegex = new RegExp(query, 'i');

        const tasks = await Task.find({
            organizationId,
            $or: [
                { title: searchRegex },
                { key: searchRegex },
                { description: searchRegex }
            ]
        }).limit(5).populate('assignee', 'name email');

        const projects = await Project.find({
            organizationId,
            $or: [
                { name: searchRegex },
                { keyPrefix: searchRegex },
                { description: searchRegex }
            ]
        }).limit(5);

        return { tasks, projects };
    }
}

module.exports = new SearchService();
