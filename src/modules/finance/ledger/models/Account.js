const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const accountSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        name: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
            required: true
        },
        description: { type: String, default: '' },
        parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
        balance: { type: Number, default: 0 },
        isSystem: { type: Boolean, default: false }, // Internal accounts like AR, AP, Cash
        isActive: { type: Boolean, default: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

accountSchema.plugin(tenantPlugin);

// Code must be unique per organization
accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.Account || mongoose.model('Account', accountSchema);
