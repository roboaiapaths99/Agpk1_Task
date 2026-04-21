const mongoose = require('mongoose');
const tenantPlugin = require('../../../core/tenantPlugin');

const branchSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String, default: 'India' },
        zipCode: { type: String },
        phone: { type: String },
        email: { type: String },
        isActive: { type: Boolean, default: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

branchSchema.plugin(tenantPlugin);
branchSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
