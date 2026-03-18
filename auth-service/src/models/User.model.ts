import { UserModel, type IUser } from '../shared/db';
import type { UserWithoutPassword } from '../types';

// Helper: Remove password from user object
function excludePassword(user: IUser): UserWithoutPassword {
  const userObj = user.toObject();
  const { password: _, ...userWithoutPassword } = userObj;
  return userWithoutPassword as UserWithoutPassword;
}

// User Model - Database Operations
export const UserModelOps = {
  async create(data: { email: string; password: string; name?: string }): Promise<UserWithoutPassword> {
    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      password: data.password,
      name: data.name || null,
    });
    return excludePassword(user);
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).lean();
  },

  async findById(id: string): Promise<UserWithoutPassword | null> {
    const user = await UserModel.findById(id);
    if (!user) return null;
    return excludePassword(user);
  },

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return UserModel.findById(id).select('+password');
  },

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  },

  async updateProfile(
    id: string,
    data: { name?: string; avatar?: string; bio?: string }
  ): Promise<UserWithoutPassword | null> {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    if (!user) return null;
    return excludePassword(user);
  },

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { password: hashedPassword });
  },

  async deactivate(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { isActive: false });
  },

  async emailExists(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  },

  async updateRecommendationsCount(id: string, count: number): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { recommendationsCount: count });
  },

  async setResetToken(id: string, token: string, expires: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  },

  async findByResetToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).lean();
  },

  async updatePasswordAndClearResetToken(id: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  },
};

export default UserModelOps;
