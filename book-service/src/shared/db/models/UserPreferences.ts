import mongoose, { Schema, Document, Types } from 'mongoose';

// UserPreferences Document Interface
export interface IUserPreferences extends Document {
  userId: Types.ObjectId;
  favoriteGenres: string[];
  favoriteAuthors: string[];
  preferredLanguages: string[];
  readingGoals: {
    booksPerYear: number;
    currentYear: number;
    booksReadThisYear: number;
  };
  notificationSettings: {
    newFollower: boolean;
    newComment: boolean;
    newLike: boolean;
    recommendations: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// UserPreferences Schema
const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
    favoriteAuthors: {
      type: [String],
      default: [],
    },
    preferredLanguages: {
      type: [String],
      default: ['en'],
    },
    readingGoals: {
      booksPerYear: {
        type: Number,
        default: 12,
        min: 1,
        max: 365,
      },
      currentYear: {
        type: Number,
        default: new Date().getFullYear(),
      },
      booksReadThisYear: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    notificationSettings: {
      newFollower: {
        type: Boolean,
        default: true,
      },
      newComment: {
        type: Boolean,
        default: true,
      },
      newLike: {
        type: Boolean,
        default: true,
      },
      recommendations: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Model
export const UserPreferencesModel = 
  mongoose.models.UserPreferences || 
  mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

export default UserPreferencesModel;
