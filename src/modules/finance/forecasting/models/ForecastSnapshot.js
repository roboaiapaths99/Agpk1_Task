const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const forecastSnapshotSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['cashflow', 'revenue', 'expense'], required: true },
        period: { type: String, required: true }, // e.g., '2026-Q2', '2026-04'
        predictions: [{
            date: { type: Date, required: true },
            value: { type: Number, required: true }
        }],
        actuals: [{
            date: { type: Date },
            value: { type: Number }
        }],
        confidence: { type: Number, min: 0, max: 100 },
        generatedAt: { type: Date, default: Date.now },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

forecastSnapshotSchema.plugin(tenantPlugin);

forecastSnapshotSchema.index({ organizationId: 1, type: 1, period: 1 });

module.exports = mongoose.models.ForecastSnapshot || mongoose.model('ForecastSnapshot', forecastSnapshotSchema);
