const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        type: { type: String, enum: ['direct', 'group', 'task', 'project'], default: 'group' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
        metadata: {
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
            projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
        }
    },
    { timestamps: true }
);

channelSchema.index({ organizationId: 1, members: 1 });

module.exports = mongoose.model('Channel', channelSchema);
