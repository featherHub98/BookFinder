import mongoose, { Schema, Document, Types } from 'mongoose';

// Recommendation Document Interface
export interface IRecommendation extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  rating: number;
  review: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  readStatus: 'read' | 'reading' | 'want_to_read';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Recommendation Schema
const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    readStatus: {
      type: String,
      enum: ['read', 'reading', 'want_to_read'],
      default: 'read',
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
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

// Compound Indexes
// Ensure a user can only have one recommendation per book
RecommendationSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// For getting public recommendations
RecommendationSchema.index({ isPublic: 1, createdAt: -1 });

// For getting user's recommendations by status
RecommendationSchema.index({ userId: 1, readStatus: 1 });

// For getting user's favorites
RecommendationSchema.index({ userId: 1, isFavorite: 1 });

// Model
export const RecommendationModel = 
  mongoose.models.Recommendation || 
  mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);

export default RecommendationModel;
