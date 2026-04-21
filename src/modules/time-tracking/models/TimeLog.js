const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // in minutes
    description: { type: String, default: '' },
    isBillable: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

timeLogSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.models.TimeLog || mongoose.model('TimeLog', timeLogSchema);
