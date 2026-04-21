const authService = require('../services/auth.service');
const { success, created } = require('../../../utils/response');

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register({ ...req.body, ipAddress: req.ip });
            return created(res, result, result.message || 'User registered successfully');
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req, res, next) {
        try {
            const user = await authService.verifyEmail(req.params.token);
            return success(res, { user }, 'Email verified successfully! You can now log in.');
        } catch (error) {
            next(error);
        }
    }

    async resendVerification(req, res, next) {
        try {
            await authService.resendVerification(req.body.email);
            return success(res, null, 'Verification email resent successfully. Please check your inbox (server console).');
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password, req.ip);
            return success(res, result, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const { user, organization } = await authService.getProfile(req.user.id);
            return success(res, { user, organization });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const user = await authService.updateProfile(req.user.id, req.body);
            return success(res, { user }, 'Profile updated');
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const users = await authService.getAllUsers(req.user.organizationId, req.query);
            return success(res, { users });
        } catch (error) {
            next(error);
        }
    }

    async updateNotificationPreferences(req, res, next) {
        try {
            const user = await authService.updateNotificationPreferences(req.user.id, req.body);
            return success(res, { user }, 'Notification preferences updated');
        } catch (error) {
            next(error);
        }
    }

    async updateDashboardLayout(req, res, next) {
        try {
            const user = await authService.updateDashboardLayout(req.user.id, req.body.layout);
            return success(res, { user }, 'Dashboard layout saved');
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
            return success(res, result);
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const token = req.body.refreshToken || req.cookies?.refreshToken;
            if (!token) throw new Error('Refresh token is required');

            const result = await authService.refreshTokens(token, req.ip);
            return success(res, result, 'Token refreshed successfully');
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res) {
        const { refreshToken } = req.body;
        await authService.revokeToken(refreshToken, req.user._id);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }

    async forgotPassword(req, res) {
        await authService.forgotPassword(req.body.email);

        res.status(200).json({
            success: true,
            message: 'If a user with that email exists, a password reset link has been sent.',
        });
    }

    async resetPassword(req, res) {
        const { accessToken, refreshToken } = await authService.resetPassword(req.params.token, req.body.password);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: { accessToken, refreshToken },
        });
    }
}

module.exports = new AuthController();
