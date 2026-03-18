import mongoose, { Schema, Document, Types } from 'mongoose';

// Follow Document Interface
export interface IFollow extends Document {
  followerId: Types.ObjectId;  // User who follows
  followingId: Types.ObjectId;  // User being followed
  createdAt: Date;
}

// Follow Schema
const FollowSchema = new Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Indexes
// Ensure a user can only follow another user once
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// For getting user's followers
FollowSchema.index({ followingId: 1, createdAt: -1 });

// For getting who a user follows
FollowSchema.index({ followerId: 1, createdAt: -1 });

// Model
export const FollowModel = 
  mongoose.models.Follow || 
  mongoose.model<IFollow>('Follow', FollowSchema);

export default FollowModel;
