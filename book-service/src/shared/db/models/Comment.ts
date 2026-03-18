import mongoose, { Schema, Document, Types } from 'mongoose';

// Comment Document Interface
export interface IComment extends Document {
  userId: Types.ObjectId;
  recommendationId: Types.ObjectId;
  parentId: Types.ObjectId | null;  // For nested comments/replies
  content: string;
  isEdited: boolean;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Schema
const CommentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recommendationId: {
      type: Schema.Types.ObjectId,
      ref: 'Recommendation',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    likesCount: {
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

// Indexes
// For getting comments on a recommendation
CommentSchema.index({ recommendationId: 1, createdAt: -1 });

// For getting replies to a comment
CommentSchema.index({ parentId: 1, createdAt: 1 });

// For getting user's comments
CommentSchema.index({ userId: 1, createdAt: -1 });

// Model
export const CommentModel = 
  mongoose.models.Comment || 
  mongoose.model<IComment>('Comment', CommentSchema);

export default CommentModel;
