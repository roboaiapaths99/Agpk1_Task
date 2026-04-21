const mongoose = require('mongoose');

const recurringTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the template'],
        trim: true
    },
    type: {
        type: String,
        enum: ['invoice', 'expense'],
        required: [true, 'Please specify the template type']
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: [true, 'Please specify the frequency']
    },
    nextRunDate: {
        type: Date,
        required: [true, 'Next run date is required']
    },
    lastRunDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active'
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Template payload data is required']
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.RecurringTemplate || mongoose.model('RecurringTemplate', recurringTemplateSchema);
