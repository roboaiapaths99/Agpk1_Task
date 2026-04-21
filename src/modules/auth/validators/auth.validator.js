const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('admin', 'manager', 'user').default('user'),
    department: Joi.string().max(100).allow(null, ''),
    team: Joi.string().max(100).allow(null, ''),
});

const loginSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    department: Joi.string().max(100).allow(null, ''),
    team: Joi.string().max(100).allow(null, ''),
    avatar: Joi.string().uri().allow(null, ''),
    hasCompletedOnboarding: Joi.boolean(),
}).min(1);

const notificationPreferencesSchema = Joi.object({
    inApp: Joi.boolean(),
    email: Joi.boolean(),
    priorityFilter: Joi.string().valid('ALL', 'MEDIUM', 'HIGH', 'CRITICAL'),
    digestEnabled: Joi.boolean(),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(6).max(128).required(),
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    notificationPreferencesSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema: forgotPasswordSchema,
};
