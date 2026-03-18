import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserModelOps from '../models/User.model';
import EmailService from './Email.service';
import type { UserWithoutPassword, JwtPayload, AuthResponse } from '../types';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'bookworm-super-secret-jwt-key-change-in-production-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m';
const RESET_TOKEN_EXPIRES = 60 * 60 * 1000; // 1 hour

export const AuthService = {
  async register(data: { email: string; password: string; name?: string }): Promise<AuthResponse> {
    const emailExists = await UserModelOps.emailExists(data.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await UserModelOps.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    const token = this.generateToken(user);
    return { user, token };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await UserModelOps.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    await UserModelOps.updateLastLogin(user._id.toString());
    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(userWithoutPassword as UserWithoutPassword);

    return { user: userWithoutPassword as UserWithoutPassword, token };
  },

  async verifyToken(token: string): Promise<UserWithoutPassword | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return UserModelOps.findById(decoded.userId);
    } catch {
      return null;
    }
  },

  async getUserById(id: string): Promise<UserWithoutPassword | null> {
    return UserModelOps.findById(id);
  },

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string; bio?: string }
  ): Promise<UserWithoutPassword> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim() || null;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar.trim() || null;
    }
    if (data.bio !== undefined) {
      updateData.bio = data.bio.trim() || null;
    }

    const user = await UserModelOps.updateProfile(userId, updateData);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await UserModelOps.findByIdWithPassword(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModelOps.updatePassword(userId, hashedPassword);
  },

  generateToken(user: UserWithoutPassword): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  async recalculateRecommendationsCount(userId: string, count: number): Promise<void> {
    await UserModelOps.updateRecommendationsCount(userId, count);
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await UserModelOps.findByEmail(email);
    
    if (!user) {
      return { 
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent' 
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES);

    await UserModelOps.setResetToken(user._id.toString(), hashedToken, resetExpires);

    const emailSent = await EmailService.sendPasswordResetEmail({
      email: user.email,
      resetToken,
      userName: user.name,
    });

    if (!emailSent) {
      console.warn(`Password reset email not sent to ${email} - check RESEND_API_KEY configuration`);
    }

    return { 
      success: true, 
      message: 'If an account with that email exists, a reset link has been sent' 
    };
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await UserModelOps.findByResetToken(hashedToken);
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new Error('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModelOps.updatePasswordAndClearResetToken(user._id.toString(), hashedPassword);
  },
};

export default AuthService;
