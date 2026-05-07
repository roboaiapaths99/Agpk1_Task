const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const RefreshToken = require('../models/RefreshToken');
const Branch = require('../../finance/models/Branch');
const { config } = require('../../../config');
const { AppError, NotFoundError, UnauthorizedError, ConflictError, ValidationError } = require('../../../core/errors');
const eventBus = require('../../../core/eventBus');
const logger = require('../../../core/logger');
const emailService = require('./email.service');
const { EVENTS } = require('../../../utils/constants');

class AuthService {
    async register(data) {
        const { email, name, password } = data;

        // Extract domain
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) throw new ValidationError('Invalid email domain');

        // Block free email providers (optional but recommended for corporate SaaS)
        // const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
        // if (freeProviders.includes(domain)) {
        //     throw new ValidationError('Please use a corporate email address to register');
        // }

        const existingUser = await User.findOne({ email });
        if (existingUser) throw new ConflictError('Email already registered');

        let organization = await Organization.findOne({ domain });
        let role = 'user';

        if (!organization) {
            // Create new organization
            const orgName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
            organization = await Organization.create({
                name: orgName,
                domain,
                slug: domain.split('.')[0],
                ownerId: new mongoose.Types.ObjectId(), // Temporary, will update after user creation
            });
            role = 'admin';
        }

        const permissions = this._getDefaultPermissions(role);

        const user = await User.create({
            ...data,
            organizationId: organization._id,
            role,
            permissions,
        });

        // Generate verification token
        const verificationToken = user.createEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Update org owner if newly created
        if (role === 'admin' && organization.ownerId.toString() !== user._id.toString()) {
            organization.ownerId = user._id;
            await organization.save();
        }

        // Send verification email via background queue
        await emailService.sendVerificationEmail(email, verificationToken);

        await eventBus.publish(EVENTS.USER_REGISTERED, {
            userId: user._id,
            email: user.email,
            name: user.name,
            organizationId: organization._id,
        });

        return {
            message: 'Registration successful! Please check your email (server console) to verify your account.',
            user
        };
    }

    async login(email, password, ipAddress) {
        const user = await User.findOne({ email }).select('+password').populate('organizationId roleId');
        if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

        // Check if user is verified
        if (!user.isVerified) {
            throw new UnauthorizedError('Please verify your email address before logging in');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new UnauthorizedError('Invalid credentials');

        user.lastLogin = new Date();
        await user.save();

        const { accessToken, refreshToken } = await this.generateTokens(user, ipAddress || '0.0.0.0');

        await eventBus.publish(EVENTS.USER_LOGIN, {
            userId: user._id,
            email: user.email,
            organizationId: user.organizationId?._id,
        });

        return {
            user,
            accessToken,
            refreshToken,
            organization: user.organizationId
        };
    }

    async refreshTokens(token, ipAddress) {
        const refreshToken = await RefreshToken.findOne({ token }).populate('userId');
        if (!refreshToken || !refreshToken.isActive) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const user = refreshToken.userId;
        const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user, ipAddress);

        // Replace old token with new one for rotation
        refreshToken.revokedAt = new Date();
        refreshToken.revokedByIp = ipAddress;
        refreshToken.replacedByToken = newRefreshToken;
        await refreshToken.save();

        return { accessToken, refreshToken: newRefreshToken };
    }

    async revokeToken(token, ipAddress) {
        const refreshToken = await RefreshToken.findOne({ token });
        if (!refreshToken) throw new UnauthorizedError('Invalid refresh token');

        refreshToken.revokedAt = new Date();
        refreshToken.revokedByIp = ipAddress;
        await refreshToken.save();
    }

    async getProfile(userId) {
        const user = await User.findById(userId).populate('organizationId roleId');
        if (!user) throw new NotFoundError('User');

        const org = user.organizationId;
        const membersCount = await User.countDocuments({ organizationId: org._id });

        return {
            user,
            organization: {
                ...org.toObject(),
                membersCount
            }
        };
    }

    async updateProfile(userId, data) {
        const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true }).populate('organizationId');
        if (!user) throw new NotFoundError('User');
        return user;
    }

    async getAllUsers(organizationId, filters = {}) {
        const query = { organizationId };
        if (filters.role) query.role = filters.role;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        return User.find(query).select('-password');
    }

    async updateNotificationPreferences(userId, preferences) {
        const user = await User.findByIdAndUpdate(
            userId,
            { notificationPreferences: preferences },
            { new: true, runValidators: true }
        );
        if (!user) throw new NotFoundError('User');
        return user;
    }

    async updateDashboardLayout(userId, layout) {
        const user = await User.findByIdAndUpdate(
            userId,
            { dashboardLayout: layout },
            { new: true, runValidators: true }
        );
        if (!user) throw new NotFoundError('User');
        return user;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');
        if (!user) throw new NotFoundError('User');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw new UnauthorizedError('Current password incorrect');

        user.password = newPassword;
        await user.save();
        return { message: 'Password updated successfully' };
    }

    async getOrganization(organizationId) {
        const organization = await Organization.findById(organizationId).populate('ownerId', 'name email');
        if (!organization) throw new NotFoundError('Organization');

        const membersCount = await User.countDocuments({ organizationId });

        const branches = await Branch.find({ organizationId });

        return {
            ...organization.toObject(),
            membersCount,
            branches
        };
    }

    async updateOrganization(organizationId, data) {
        // Find existing organization first to ensure it exists and to merge settings if needed
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            throw new AppError('Organization not found', 404);
        }

        // Apply specific fields from data to the organization instance
        // This avoids triggering validation for fields like 'domain' or 'ownerId' if they aren't provided in the PATCH
        const updatableFields = ['name', 'description', 'logo', 'settings', 'dunningSettings'];

        updatableFields.forEach(field => {
            if (data[field] !== undefined) {
                if ((field === 'settings' || field === 'dunningSettings') && typeof data[field] === 'object') {
                    // Merge settings instead of overwriting the whole object
                    organization[field] = { ...organization[field], ...data[field] };
                } else {
                    organization[field] = data[field];
                }
            }
        });

        await organization.save();
        return organization;
    }

    async generateTokens(user, ipAddress) {
        const accessToken = this._generateAccessToken(user);
        const refreshToken = await this._generateRefreshToken(user, ipAddress);
        return { accessToken, refreshToken: refreshToken.token };
    }

    _getDefaultPermissions(role) {
        const permissions = {
            user: ['tasks:read', 'tasks:create', 'tasks:update', 'profile:update'],
            manager: [
                'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
                'profile:update', 'organization:read', 'organization:update',
                'users:read'
            ],
            admin: [
                'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
                'profile:update', 'organization:read', 'organization:update',
                'users:read', 'users:manage', 'site:admin'
            ]
        };
        return permissions[role] || permissions.user;
    }

    _generateAccessToken(user) {
        let permissions = user.permissions || [];

        // If user has a role object populated, map granular permissions
        if (user.roleId && user.roleId.permissions) {
            const rolePermissions = user.roleId.permissions.map(p => {
                const modulePrefix = p.module.toLowerCase();
                const access = p.access;

                if (access === 'NONE') return [];
                if (access === 'READ') return [`${modulePrefix}:read`];
                if (access === 'WRITE') return [`${modulePrefix}:read`, `${modulePrefix}:create`, `${modulePrefix}:update`];
                if (access === 'ADMIN') return [`${modulePrefix}:read`, `${modulePrefix}:create`, `${modulePrefix}:update`, `${modulePrefix}:delete`, `${modulePrefix}:manage`];
                return [];
            }).flat();

            permissions = [...new Set([...permissions, ...rolePermissions])];
        }

        return jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                permissions: permissions,
                name: user.name,
                organizationId: user.organizationId?._id || user.organizationId
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );
    }

    async _generateRefreshToken(user, ipAddress) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Default to 30 days if config not available or hardcoded

        return RefreshToken.create({
            token,
            userId: user._id,
            expiresAt,
            createdByIp: ipAddress
        });
    }

    async revokeToken(token, userId) {
        return RefreshToken.deleteOne({ token, user: userId });
    }

    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('No user found with that email address');
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Send password reset email via background queue
        await emailService.sendPasswordResetEmail(email, resetToken);

        return resetToken;
    }

    async resetPassword(token, password) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error('Token is invalid or has expired');
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return this.generateTokens(user, 'system'); // Pass user object instead of ID
    }

    async verifyEmail(token) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error('Token is invalid or has expired');
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return user;
    }

    async resendVerification(email) {
        const user = await User.findOne({ email });
        if (!user) throw new NotFoundError('User');
        if (user.isVerified) throw new Error('Account is already verified');

        const verificationToken = user.createEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Resend verification email via background queue
        await emailService.sendVerificationEmail(email, verificationToken);

        return true;
    }
}

module.exports = new AuthService();
