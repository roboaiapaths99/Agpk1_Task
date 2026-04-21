const mongoose = require('mongoose');

const standupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    whatIDid: {
        type: String,
        required: true
    },
    whatIWillDo: {
        type: String,
        required: true
    },
    blockers: {
        type: String,
        default: 'None'
    },
    mood: {
        type: String,
        enum: ['happy', 'neutral', 'stressed', 'overloaded'],
        default: 'neutral'
    }
}, { timestamps: true });

// Ensure only one standup per user per day per organization
standupSchema.index({ user: 1, date: 1, organizationId: 1 }, { unique: true });

const tenantPlugin = require('../../../core/tenantPlugin');
standupSchema.plugin(tenantPlugin);

module.exports = mongoose.models.Standup || mongoose.model('Standup', standupSchema);
