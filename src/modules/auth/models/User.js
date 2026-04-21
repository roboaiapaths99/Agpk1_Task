const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'user'],
            default: 'user',
        },
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null,
        },
        permissions: [{
            type: String,
        }],
        isVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        notificationPreferences: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            taskAssigned: { type: Boolean, default: true },
            taskCompleted: { type: Boolean, default: true },
            approvalRequired: { type: Boolean, default: true },
            mentions: { type: Boolean, default: true },
            priorityFilter: {
                type: String,
                enum: ['ALL', 'MEDIUM', 'HIGH', 'CRITICAL'],
                default: 'ALL',
            },
            digestEnabled: { type: Boolean, default: true },
        },
        avatar: { type: String, default: null },
        department: { type: String, default: null },
        team: { type: String, default: null },
        designation: { type: String, default: null },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        dashboardLayout: {
            type: [{
                id: String,
                type: { type: String },
                x: Number,
                y: Number,
                w: Number,
                h: Number,
                config: mongoose.Schema.Types.Mixed
            }],
            default: []
        },
        hasCompletedOnboarding: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Performance & Uniqueness Indices
userSchema.index({ organizationId: 1, email: 1 }); // Optimize multi-tenant queries
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Create email verification token
userSchema.methods.createEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return verificationToken;
};

const tenantPlugin = require('../../../core/tenantPlugin');
userSchema.plugin(tenantPlugin);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
