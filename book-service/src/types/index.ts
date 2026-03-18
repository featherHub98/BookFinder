import { Request } from 'express';
import { Types } from 'mongoose';

// Book Types
export interface BookResponse {
  _id: Types.ObjectId;
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

export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  openLibraryId?: string;
  description?: string;
  coverImage?: string;
  publisher?: string;
  publishYear?: number;
  pageCount?: number;
  genres?: string[];
}

// Recommendation Types
export interface RecommendationResponse {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  rating: number;
  review: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  readStatus: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
  book?: BookResponse;
  user?: {
    _id: Types.ObjectId;
    name: string | null;
    avatar: string | null;
  };
}

export interface CreateRecommendationInput {
  bookId: string;
  rating: number;
  review?: string;
  isPublic?: boolean;
  readStatus?: string;
}

// Open Library API Types
export interface OpenLibrarySearchResult {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  first_publish_year?: number;
  publisher?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  ratings_average?: number;
  ratings_count?: number;
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibrarySearchResult[];
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    id: string;
    email: string;
    role: string;
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
