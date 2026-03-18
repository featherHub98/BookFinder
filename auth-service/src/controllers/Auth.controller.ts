import type { Request, Response } from 'express';
import AuthService from '../services/Auth.service';
import { validateInput, registerSchema, loginSchema } from '../utils/validation';
import type { AuthenticatedRequest, ApiResponse, AuthResponse } from '../types';

const COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 1000,
  path: '/',
};

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateInput(registerSchema, req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: validation.error,
        } as ApiResponse);
        return;
      }

      const result = await AuthService.register(validation.data);
      res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateInput(loginSchema, req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: validation.error,
        } as ApiResponse);
        return;
      }

      const result = await AuthService.login(
        validation.data.email,
        validation.data.password
      );
      res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: req.user,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    } as ApiResponse);
  },

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        } as ApiResponse);
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        } as ApiResponse);
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters',
        } as ApiResponse);
        return;
      }

      await AuthService.changePassword(
        req.user._id.toString(),
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: req.user,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token verification failed';
      res.status(401).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await AuthService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      const publicProfile = {
        _id: user._id,
        email: '',
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        recommendationsCount: user.recommendationsCount,
        createdAt: user.createdAt,
      };

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: publicProfile,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        } as ApiResponse);
        return;
      }

      const { name, avatar, bio } = req.body;

      if (name !== undefined && typeof name !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Name must be a string',
        } as ApiResponse);
        return;
      }

      if (avatar !== undefined && typeof avatar !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Avatar must be a string URL',
        } as ApiResponse);
        return;
      }

      if (bio !== undefined && typeof bio !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Bio must be a string',
        } as ApiResponse);
        return;
      }

      const updatedUser = await AuthService.updateProfile(req.user._id.toString(), {
        name,
        avatar,
        bio,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        } as ApiResponse);
        return;
      }

      const result = await AuthService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: result.message,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process request';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        } as ApiResponse);
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters',
        } as ApiResponse);
        return;
      }

      await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully',
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },
};

export default AuthController;
