const mongoose = require('mongoose');

const objectiveSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Objective title is required'],
            trim: true,
            maxlength: 300,
        },
        description: {
            type: String,
            default: '',
            maxlength: 2000,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        level: {
            type: String,
            enum: ['company', 'department', 'team', 'individual'],
            required: true,
            index: true,
        },
        parentObjective: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Objective',
            default: null,
        },
        period: {
            type: String,
            required: true, // e.g. "Q2-2026"
            index: true,
        },
        status: {
            type: String,
            enum: ['on_track', 'at_risk', 'behind', 'completed', 'cancelled'],
            default: 'on_track',
        },
        progress: {
            type: Number,
            default: 0, // 0-100, auto-calculated from key results
            min: 0,
            max: 100,
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

objectiveSchema.virtual('keyResults', {
    ref: 'KeyResult',
    localField: '_id',
    foreignField: 'objectiveId',
});

objectiveSchema.virtual('childObjectives', {
    ref: 'Objective',
    localField: '_id',
    foreignField: 'parentObjective',
});

objectiveSchema.index({ organizationId: 1, period: 1, level: 1 });

module.exports = mongoose.models.Objective || mongoose.model('Objective', objectiveSchema);
