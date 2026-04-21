const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Sprint name is required'],
        trim: true
    },
    goal: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['planned', 'active', 'completed'],
        default: 'planned',
        index: true
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.models.Sprint || mongoose.model('Sprint', sprintSchema);
