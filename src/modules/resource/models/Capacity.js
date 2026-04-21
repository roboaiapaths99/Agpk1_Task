const mongoose = require('mongoose');

const capacitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        weekStartDate: {
            type: Date,
            required: true,
        },
        maxHours: {
            type: Number,
            default: 40,
        },
        allocatedHours: {
            type: Number,
            default: 0,
        },
        timeOff: [
            {
                date: Date,
                type: {
                    type: String,
                    enum: ['vacation', 'sick', 'holiday', 'personal'],
                    default: 'vacation',
                },
                hours: { type: Number, default: 8 },
            },
        ],
        skills: [{ type: String, trim: true }],
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

capacitySchema.index({ organizationId: 1, weekStartDate: 1 });
capacitySchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

// Virtual: available hours
capacitySchema.virtual('availableHours').get(function () {
    const timeOffHours = (this.timeOff || []).reduce((sum, t) => sum + (t.hours || 8), 0);
    return Math.max(this.maxHours - this.allocatedHours - timeOffHours, 0);
});

// Virtual: utilization percentage
capacitySchema.virtual('utilization').get(function () {
    if (this.maxHours === 0) return 0;
    return Math.round((this.allocatedHours / this.maxHours) * 100);
});

module.exports = mongoose.models.Capacity || mongoose.model('Capacity', capacitySchema);
