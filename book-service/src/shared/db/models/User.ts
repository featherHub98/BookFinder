import mongoose, { Schema, Document } from 'mongoose';

// User Document Interface
export interface IUser extends Document {
  email: string;
  password: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  followersCount: number;
  followingCount: number;
  recommendationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: null,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      maxlength: 500,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    recommendationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Methods
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Model
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
