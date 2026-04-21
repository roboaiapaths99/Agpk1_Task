const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        content: { type: String, required: true },
        type: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
        attachments: [{
            url: String,
            name: String,
            size: Number,
            mimeType: String
        }],
        reactions: [{
            emoji: String,
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }],
        readBy: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            at: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true }
);

messageSchema.index({ channelId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
