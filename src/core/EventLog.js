const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        eventName: {
            type: String,
            required: true,
            index: true,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ['published', 'processed', 'failed'],
            default: 'published',
            index: true,
        },
        error: {
            type: String,
            default: null,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

eventLogSchema.index({ eventName: 1, timestamp: -1 });

module.exports = mongoose.model('EventLog', eventLogSchema);
