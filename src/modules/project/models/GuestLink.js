const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const guestLinkSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    token: {
        type: String,
        default: () => randomUUID(),
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        select: false // Only fetch when needed for verification
    },
    accessCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('GuestLink', guestLinkSchema);
