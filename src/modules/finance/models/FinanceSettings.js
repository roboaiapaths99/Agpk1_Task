const mongoose = require('mongoose');
const tenantPlugin = require('../../../core/tenantPlugin');

const financeSettingsSchema = new mongoose.Schema(
    {
        fiscalYearStart: { type: String, default: '04-01' }, // MM-DD
        fiscalYearEnd: { type: String, default: '03-31' },
        lockDate: { type: Date }, // No edits allowed before this date
        baseCurrency: { type: String, default: 'INR' },
        taxPresets: [{
            name: String,
            rate: Number
        }],
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

financeSettingsSchema.plugin(tenantPlugin);

module.exports = mongoose.models.FinanceSettings || mongoose.model('FinanceSettings', financeSettingsSchema);
