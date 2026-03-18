import mongoose, { Schema, Document, Types } from 'mongoose';

// Like Document Interface
export interface ILike extends Document {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;  // Can be recommendation, comment, etc.
  targetType: 'recommendation' | 'comment';
  createdAt: Date;
}

// Like Schema
const LikeSchema = new Schema<ILike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['recommendation', 'comment'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Indexes
// Ensure a user can only like a target once
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

// For counting likes on a target
LikeSchema.index({ targetId: 1, targetType: 1 });

// Model
export const LikeModel = 
  mongoose.models.Like || 
  mongoose.model<ILike>('Like', LikeSchema);

export default LikeModel;
