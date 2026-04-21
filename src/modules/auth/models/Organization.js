const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
        },
        domain: {
            type: String,
            required: [true, 'Domain is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        plan: {
            type: String,
            enum: ['free', 'pro', 'enterprise'],
            default: 'free',
        },
        status: {
            type: String,
            enum: ['active', 'suspended'],
            default: 'active',
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
            trim: true,
        },
        settings: {
            maxUsers: { type: Number, default: 5 },
            features: [String],
        },
        branding: {
            primaryColor: { type: String, default: '#3b82f6' }, // blue-500
            secondaryColor: { type: String, default: '#1e293b' }, // slate-800
            accentColor: { type: String, default: '#8b5cf6' }, // violet-500
            fontFamily: { type: String, default: 'Inter' },
            customCss: { type: String },
        },
        dunningSettings: {
            enabled: { type: Boolean, default: true },
            stages: [{
                daysAfterDue: { type: Number, required: true },
                action: { type: String, enum: ['remind', 'warn', 'restrict'], default: 'remind' },
                channels: { 
                    type: [String], 
                    enum: ['email', 'slack', 'in_app'],
                    default: ['email']
                },
                template: { type: String }, // Custom message text
            }],
            lastCheckAt: { type: Date }
        }
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
