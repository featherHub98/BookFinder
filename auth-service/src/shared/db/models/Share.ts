import mongoose, { Schema, Document, Types } from 'mongoose';

// Share Document Interface
export interface IShare extends Document {
  userId: Types.ObjectId;
  recommendationId: Types.ObjectId;
  platform: 'internal' | 'twitter' | 'facebook' | 'linkedin' | 'copy_link';
  message: string | null;
  createdAt: Date;
}

// Share Schema
const ShareSchema = new Schema<IShare>(
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
    platform: {
      type: String,
      enum: ['internal', 'twitter', 'facebook', 'linkedin', 'copy_link'],
      required: true,
    },
    message: {
      type: String,
      default: null,
      maxlength: 280,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Indexes
// For counting shares on a recommendation
ShareSchema.index({ recommendationId: 1 });

// For getting user's shares
ShareSchema.index({ userId: 1, createdAt: -1 });

// Model
export const ShareModel = 
  mongoose.models.Share || 
  mongoose.model<IShare>('Share', ShareSchema);

export default ShareModel;
