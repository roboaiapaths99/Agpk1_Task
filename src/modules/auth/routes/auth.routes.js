const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const organizationController = require('../controllers/organization.controller');
const roleController = require('../controllers/role.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { authLimiter } = require('../../../middlewares/rateLimiter');
const { registerSchema, loginSchema, updateProfileSchema, notificationPreferencesSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema } = require('../validators/auth.validator');

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerification);
router.post('/logout', authenticate, authController.logout);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.patch('/me/notification-preferences', authenticate, validate(notificationPreferencesSchema), authController.updateNotificationPreferences);
router.patch('/me/dashboard-layout', authenticate, authController.updateDashboardLayout);
router.patch('/change-password', authenticate, authController.changePassword);

// Organization routes
router.get('/organization', authenticate, organizationController.getOrganization);
router.patch('/organization', authenticate, authorize('admin', 'manager'), organizationController.updateOrganization);

// Role routes
router.post('/roles', authenticate, authorize('admin'), roleController.create);
router.get('/roles', authenticate, authorize('admin', 'manager'), roleController.getAll);
router.get('/roles/:id', authenticate, authorize('admin', 'manager'), roleController.getById);
router.patch('/roles/:id', authenticate, authorize('admin'), roleController.update);
router.delete('/roles/:id', authenticate, authorize('admin'), roleController.delete);

// Admin routes
router.get('/users', authenticate, authorize('admin', 'manager'), authController.getAllUsers);

// Hierarchy routes
const hierarchyController = require('../controllers/hierarchy.controller');
router.get('/hierarchy', authenticate, hierarchyController.getHierarchy);
router.patch('/hierarchy/manager', authenticate, authorize('admin', 'manager'), hierarchyController.updateManager);
router.get('/potential-managers', authenticate, hierarchyController.getPotentialManagers);

module.exports = router;
