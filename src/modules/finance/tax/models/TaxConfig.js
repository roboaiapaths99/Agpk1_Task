const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const taxConfigSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        rate: { type: Number, required: true }, // Percentage, e.g., 18 for 18%
        type: { type: String, enum: ['gst', 'vat', 'cgst', 'sgst', 'igst', 'custom'], required: true, lowercase: true },
        description: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

taxConfigSchema.plugin(tenantPlugin);

taxConfigSchema.index({ organizationId: 1, isDefault: 1 });

module.exports = mongoose.models.TaxConfig || mongoose.model('TaxConfig', taxConfigSchema);
