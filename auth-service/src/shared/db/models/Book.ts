import mongoose, { Schema, Document } from 'mongoose';

// Book Document Interface
export interface IBook extends Document {
  title: string;
  author: string;
  isbn: string | null;
  openLibraryId: string | null;
  description: string | null;
  coverImage: string | null;
  publisher: string | null;
  publishYear: number | null;
  pageCount: number | null;
  genres: string[];
  averageRating: number;
  ratingsCount: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

// Book Schema
const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      // Note: We don't use unique here because many Open Library books don't have ISBNs
      // Instead, we use openLibraryId for uniqueness
      sparse: true,
      trim: true,
      default: null,
    },
    openLibraryId: {
      type: String,
      sparse: true,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    publisher: {
      type: String,
      default: null,
    },
    publishYear: {
      type: Number,
      default: null,
    },
    pageCount: {
      type: Number,
      default: null,
    },
    genres: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['open_library', 'manual'],
      default: 'open_library',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for search
BookSchema.index({ title: 'text', author: 'text', genres: 'text' });
// Unique compound index on openLibraryId to prevent duplicates
BookSchema.index({ openLibraryId: 1 }, { unique: true, sparse: true });

// Model
export const BookModel = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);

export default BookModel;
