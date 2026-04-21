const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');
const Task = require('../../work-item/models/Task');
const mongoose = require('mongoose');

// Template content definitions
const TEMPLATES = {
    prd: {
        title: 'Product Requirements Document',
        icon: '📋',
        content: `<h1>Product Requirements Document</h1>
<h2>1. Overview</h2><p>Brief description of the feature or product.</p>
<h2>2. Problem Statement</h2><p>What problem does this solve?</p>
<h2>3. Goals & Success Metrics</h2><ul><li>Goal 1</li><li>KPI: </li></ul>
<h2>4. User Stories</h2><p>As a [user], I want [feature] so that [benefit].</p>
<h2>5. Requirements</h2><h3>Functional</h3><ul><li></li></ul><h3>Non-Functional</h3><ul><li></li></ul>
<h2>6. Design</h2><p>Link to design files or embed mockups.</p>
<h2>7. Timeline</h2><table><tr><th>Phase</th><th>Date</th><th>Deliverable</th></tr><tr><td></td><td></td><td></td></tr></table>
<h2>8. Risks & Mitigations</h2><ul><li></li></ul>`,
    },
    meeting: {
        title: 'Meeting Notes',
        icon: '🗓️',
        content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> </p>
<h2>Agenda</h2><ol><li></li></ol>
<h2>Discussion</h2><p></p>
<h2>Action Items</h2><ul><li>[ ] Action item - @owner - Due date</li></ul>
<h2>Decisions</h2><ul><li></li></ul>
<h2>Next Meeting</h2><p></p>`,
    },
    retro: {
        title: 'Sprint Retrospective',
        icon: '🔄',
        content: `<h1>Sprint Retrospective</h1>
<p><strong>Sprint:</strong> </p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<h2>🟢 What Went Well</h2><ul><li></li></ul>
<h2>🔴 What Didn't Go Well</h2><ul><li></li></ul>
<h2>🔵 What Can We Improve</h2><ul><li></li></ul>
<h2>⭐ Action Items</h2><ul><li>[ ] </li></ul>`,
    },
    design: {
        title: 'Design Specification',
        icon: '🎨',
        content: `<h1>Design Specification</h1>
<h2>1. Design Overview</h2><p></p>
<h2>2. User Flow</h2><p></p>
<h2>3. Wireframes / Mockups</h2><p></p>
<h2>4. Component Specifications</h2><p></p>
<h2>5. Interaction Details</h2><p></p>
<h2>6. Accessibility Requirements</h2><p></p>`,
    },
    runbook: {
        title: 'Operations Runbook',
        icon: '🛠️',
        content: `<h1>Runbook: [Service Name]</h1>
<h2>1. Service Overview</h2><p></p>
<h2>2. Architecture</h2><p></p>
<h2>3. Common Issues & Resolution</h2><h3>Issue 1</h3><p><strong>Symptoms:</strong></p><p><strong>Resolution:</strong></p>
<h2>4. Deployment Procedure</h2><ol><li></li></ol>
<h2>5. Rollback Procedure</h2><ol><li></li></ol>
<h2>6. Contacts</h2><ul><li></li></ul>`,
    },
    blank: {
        title: 'Untitled Document',
        icon: '📄',
        content: '<h1>Untitled</h1><p></p>',
    },
};

class DocService {
    async create({ title, content, projectId, parentDocId, templateType, organizationId, userId }) {
        const template = templateType && TEMPLATES[templateType] ? TEMPLATES[templateType] : TEMPLATES.blank;

        const doc = await Document.create({
            title: title || template.title,
            content: content || template.content,
            icon: template.icon,
            projectId: projectId || null,
            parentDocId: parentDocId || null,
            isTemplate: false,
            templateType: templateType || 'blank',
            organizationId,
            createdBy: userId,
            lastEditedBy: userId,
        });

        return doc;
    }

    async getAll({ organizationId, projectId, parentDocId, search, isTemplate }) {
        const filter = { organizationId, isArchived: false };

        if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId);
        if (parentDocId !== undefined) {
            filter.parentDocId = parentDocId ? new mongoose.Types.ObjectId(parentDocId) : null;
        }
        if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
        if (search) filter.$text = { $search: search };

        const docs = await Document.find(filter)
            .populate('createdBy', 'name email avatar')
            .populate('lastEditedBy', 'name email avatar')
            .sort({ sortOrder: 1, updatedAt: -1 })
            .lean();

        return docs;
    }

    async getById(docId, organizationId) {
        const doc = await Document.findOne({ _id: docId, organizationId })
            .populate('createdBy', 'name email avatar')
            .populate('lastEditedBy', 'name email avatar')
            .populate('linkedTasks', 'title key status priority')
            .populate({
                path: 'children',
                select: 'title icon updatedAt createdBy',
                populate: { path: 'createdBy', select: 'name avatar' },
            });

        if (!doc) {
            const error = new Error('Document not found');
            error.statusCode = 404;
            throw error;
        }

        return doc;
    }

    async update(docId, updates, userId, organizationId) {
        // Find existing doc to save a version snapshot if content is changing
        const existingDoc = await Document.findOne({ _id: docId, organizationId });
        if (!existingDoc) {
            const error = new Error('Document not found');
            error.statusCode = 404;
            throw error;
        }

        // Only create a version if content or title changed
        const hasContentChanged = updates.content && updates.content !== existingDoc.content;
        const hasTitleChanged = updates.title && updates.title !== existingDoc.title;

        if (hasContentChanged || hasTitleChanged) {
            await DocumentVersion.create({
                documentId: existingDoc._id,
                version: existingDoc.version,
                title: existingDoc.title,
                content: existingDoc.content,
                createdBy: existingDoc.lastEditedBy || existingDoc.createdBy,
                organizationId
            });
        }

        const doc = await Document.findOneAndUpdate(
            { _id: docId, organizationId },
            {
                ...updates,
                lastEditedBy: userId,
                $inc: { version: 1 },
            },
            { new: true, runValidators: true }
        );

        return doc;
    }

    async convertToTemplate(docId, organizationId) {
        const doc = await Document.findOneAndUpdate(
            { _id: docId, organizationId },
            { isTemplate: true },
            { new: true }
        );
        if (!doc) {
            const error = new Error('Document not found');
            error.statusCode = 404;
            throw error;
        }
        return doc;
    }

    async archive(docId, organizationId) {
        // Archive the doc and all its children recursively
        await Document.updateMany(
            { $or: [{ _id: docId }, { parentDocId: docId }], organizationId },
            { isArchived: true }
        );
        return { success: true };
    }

    async linkTask(docId, taskId, organizationId) {
        // Verify both doc and task belong to the same org
        const [doc, task] = await Promise.all([
            Document.findOne({ _id: docId, organizationId }),
            Task.findOne({ _id: taskId, organizationId }),
        ]);

        if (!doc || !task) {
            const error = new Error('Document or Task not found');
            error.statusCode = 404;
            throw error;
        }

        if (!doc.linkedTasks.includes(taskId)) {
            doc.linkedTasks.push(taskId);
            await doc.save();
        }

        return doc;
    }

    async unlinkTask(docId, taskId, organizationId) {
        const doc = await Document.findOneAndUpdate(
            { _id: docId, organizationId },
            { $pull: { linkedTasks: taskId } },
            { new: true }
        );
        return doc;
    }

    async getTemplates(organizationId) {
        // Return built-in template definitions plus any user-created templates
        const userTemplates = await Document.find({ organizationId, isTemplate: true, isArchived: false })
            .select('title icon templateType content')
            .lean();

        const builtIn = Object.entries(TEMPLATES).map(([key, val]) => ({
            _id: `builtin_${key}`,
            templateType: key,
            title: val.title,
            icon: val.icon,
            isBuiltIn: true,
        }));

        return [...builtIn, ...userTemplates];
    }

    async getDocTree(organizationId, projectId) {
        // Build a nested tree of documents for the sidebar
        const docs = await Document.find({
            organizationId,
            projectId: projectId ? new mongoose.Types.ObjectId(projectId) : null,
            isArchived: false,
        })
            .select('title icon parentDocId sortOrder updatedAt')
            .sort({ sortOrder: 1, updatedAt: -1 })
            .lean();

        // Build tree from flat list
        const map = {};
        const roots = [];
        docs.forEach((d) => {
            d.children = [];
            map[d._id.toString()] = d;
        });
        docs.forEach((d) => {
            if (d.parentDocId && map[d.parentDocId.toString()]) {
                map[d.parentDocId.toString()].children.push(d);
            } else {
                roots.push(d);
            }
        });

        return roots;
    }
}

module.exports = new DocService();
