// Shared Database Module
import mongoose from 'mongoose';

export { connectDatabase, disconnectDatabase, isDatabaseConnected, clearDatabase } from './connection';
export { UserModel, type IUser } from './models/User';
export { BookModel, type IBook } from './models/Book';
export { RecommendationModel, type IRecommendation } from './models/Recommendation';
export { LikeModel, type ILike } from './models/Like';
export { CommentModel, type IComment } from './models/Comment';
export { ShareModel, type IShare } from './models/Share';
export { FollowModel, type IFollow } from './models/Follow';
export { UserPreferencesModel, type IUserPreferences } from './models/UserPreferences';
export { mongoose };
