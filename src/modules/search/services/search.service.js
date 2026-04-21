const Task = require('../../work-item/models/Task');
const Project = require('../../project/models/Project');
const Document = require('../../docs/models/Document');
const User = require('../../auth/models/User');

class SearchService {
    async globalSearch(query, organizationId, userId) {
        if (!query || query.trim().length === 0) return [];

        const q = new RegExp(query.trim(), 'i');

        // Parallel search across collections
        const [tasks, projects, docs, users] = await Promise.all([
            // Tasks (Search in title, key, or description)
            Task.find({
                organizationId,
                $or: [{ title: q }, { key: q }, { description: q }],
            })
                .select('title key status priority project')
                .populate('project', 'name')
                .limit(5)
                .lean(),

            // Projects
            Project.find({
                organizationId,
                $or: [{ name: q }, { key: q }],
                members: userId, // Quick access control
            })
                .select('name key color')
                .limit(5)
                .lean(),

            // Documents
            Document.find({
                organizationId,
                title: q,
            })
                .select('title project createdAt')
                .populate('project', 'name')
                .limit(5)
                .lean(),

            // Users
            User.find({
                organizationId,
                $or: [{ name: q }, { email: q }],
            })
                .select('name email avatar role')
                .limit(5)
                .lean(),
        ]);

        return {
            tasks: tasks.map(t => ({ id: t._id, type: 'task', title: t.title, subtitle: `${t.key} • ${t.project?.name || ''}`, url: `/tasks?selected=${t._id}`, icon: 'task' })),
            projects: projects.map(p => ({ id: p._id, type: 'project', title: p.name, subtitle: `Key: ${p.key}`, url: `/projects/${p._id}`, icon: 'project', color: p.color })),
            docs: docs.map(d => ({ id: d._id, type: 'doc', title: d.title, subtitle: `in ${d.project?.name || 'Org'}`, url: `/docs?docId=${d._id}`, icon: 'doc' })),
            users: users.map(u => ({ id: u._id, type: 'user', title: u.name, subtitle: u.email, url: `/organization`, icon: 'user' }))
        };
    }
}

module.exports = new SearchService();
