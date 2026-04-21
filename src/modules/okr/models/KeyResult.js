const mongoose = require('mongoose');

const keyResultSchema = new mongoose.Schema(
    {
        objectiveId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Objective',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Key Result title is required'],
            trim: true,
        },
        metricType: {
            type: String,
            enum: ['percentage', 'number', 'currency', 'boolean'],
            default: 'percentage',
        },
        startValue: {
            type: Number,
            default: 0,
        },
        targetValue: {
            type: Number,
            required: true,
        },
        currentValue: {
            type: Number,
            default: 0,
        },
        unit: {
            type: String,
            default: '', // e.g. "%", "$", "users", "features"
        },
        linkedTasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task',
            },
        ],
        linkedProjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project',
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: calculated progress %
keyResultSchema.virtual('progress').get(function () {
    const range = this.targetValue - this.startValue;
    if (range === 0) return this.currentValue >= this.targetValue ? 100 : 0;
    const pct = ((this.currentValue - this.startValue) / range) * 100;
    return Math.min(Math.max(Math.round(pct), 0), 100);
});

keyResultSchema.index({ organizationId: 1, objectiveId: 1 });

module.exports = mongoose.models.KeyResult || mongoose.model('KeyResult', keyResultSchema);
