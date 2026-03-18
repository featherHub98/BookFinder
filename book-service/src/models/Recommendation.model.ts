import { RecommendationModel, BookModel, UserModel, type IRecommendation } from '../shared/db';
import type { RecommendationResponse, BookResponse } from '../types';
import { Types } from 'mongoose';

// Helper: Transform MongoDB document to response
async function toResponse(recommendation: IRecommendation): Promise<RecommendationResponse> {
  const [book, user] = await Promise.all([
    BookModel.findById(recommendation.bookId),
    UserModel.findById(recommendation.userId).select('name avatar'),
  ]);

  return {
    _id: recommendation._id,
    userId: recommendation.userId,
    bookId: recommendation.bookId,
    rating: recommendation.rating,
    review: recommendation.review,
    isPublic: recommendation.isPublic,
    isFavorite: recommendation.isFavorite,
    readStatus: recommendation.readStatus,
    likesCount: recommendation.likesCount || 0,
    commentsCount: recommendation.commentsCount || 0,
    sharesCount: recommendation.sharesCount || 0,
    createdAt: recommendation.createdAt,
    updatedAt: recommendation.updatedAt,
    book: book ? {
      _id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      openLibraryId: book.openLibraryId,
      description: book.description,
      coverImage: book.coverImage,
      publisher: book.publisher,
      publishYear: book.publishYear,
      pageCount: book.pageCount,
      genres: book.genres,
      averageRating: book.averageRating,
      ratingsCount: book.ratingsCount,
      source: book.source,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    } : undefined,
    user: user ? {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
    } : undefined,
  };
}

// Recommendation Model - Database Operations
export const RecommendationModelOps = {
  async create(userId: string, data: { bookId: string; rating: number; review?: string; isPublic?: boolean; readStatus?: string }): Promise<RecommendationResponse> {
    const recommendation = await RecommendationModel.create({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(data.bookId),
      rating: data.rating,
      review: data.review || null,
      isPublic: data.isPublic ?? true,
      readStatus: data.readStatus || 'read',
    });

    // Increment user's recommendationsCount
    await UserModel.findByIdAndUpdate(userId, { $inc: { recommendationsCount: 1 } });

    return toResponse(recommendation);
  },

  async findById(id: string): Promise<RecommendationResponse | null> {
    const recommendation = await RecommendationModel.findById(id);
    return recommendation ? toResponse(recommendation) : null;
  },

  async findByUserAndBook(userId: string, bookId: string): Promise<RecommendationResponse | null> {
    const recommendation = await RecommendationModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });
    return recommendation ? toResponse(recommendation) : null;
  },

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: RecommendationResponse[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RecommendationModel.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RecommendationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    const responses = await Promise.all(items.map(toResponse));

    return {
      items: responses,
      total,
      hasMore: skip + items.length < total,
    };
  },

  async getPublicByBookId(bookId: string, limit: number = 10): Promise<Array<{
    _id: Types.ObjectId;
    rating: number;
    review: string | null;
    createdAt: Date;
    userId: Types.ObjectId;
    user?: {
      _id: Types.ObjectId;
      name: string | null;
      avatar: string | null;
    };
  }>> {
    const recommendations = await RecommendationModel.find({
      bookId: new Types.ObjectId(bookId),
      isPublic: true,
    })
    .select('rating review createdAt userId')
    .sort({ createdAt: -1 })
    .limit(limit);

    // Get user info for each recommendation
    const userPromises = recommendations.map(async (r) => {
      const user = await UserModel.findById(r.userId).select('name avatar');
      return {
        _id: r._id,
        rating: r.rating,
        review: r.review,
        createdAt: r.createdAt,
        userId: r.userId,
        user: user ? {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        } : undefined,
      };
    });

    return Promise.all(userPromises);
  },

  async getRatingStats(bookId: string): Promise<{
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  }> {
    const recommendations = await RecommendationModel.find({
      bookId: new Types.ObjectId(bookId),
    }).select('rating');

    const totalRatings = recommendations.length;
    const averageRating = totalRatings > 0
      ? recommendations.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    recommendations.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  },

  async getPublic(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: RecommendationResponse[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RecommendationModel.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RecommendationModel.countDocuments({ isPublic: true }),
    ]);

    const responses = await Promise.all(items.map(toResponse));

    return {
      items: responses,
      total,
      hasMore: skip + items.length < total,
    };
  },

  async update(
    id: string,
    data: Partial<{
      rating: number;
      review: string;
      isPublic: boolean;
      isFavorite: boolean;
      readStatus: string;
    }>
  ): Promise<RecommendationResponse | null> {
    const recommendation = await RecommendationModel.findByIdAndUpdate(id, data, { new: true });
    return recommendation ? toResponse(recommendation) : null;
  },

  async delete(id: string): Promise<void> {
    // Get the recommendation first to find the userId
    const recommendation = await RecommendationModel.findById(id);
    if (recommendation) {
      await RecommendationModel.findByIdAndDelete(id);
      // Decrement user's recommendationsCount
      await UserModel.findByIdAndUpdate(recommendation.userId, { $inc: { recommendationsCount: -1 } });
    }
  },

  async isOwner(recommendationId: string, userId: string): Promise<boolean> {
    const recommendation = await RecommendationModel.findById(recommendationId).select('userId');
    return recommendation?.userId.toString() === userId;
  },

  async getFavorites(userId: string): Promise<RecommendationResponse[]> {
    const items = await RecommendationModel.find({
      userId: new Types.ObjectId(userId),
      isFavorite: true,
    }).sort({ createdAt: -1 });

    return Promise.all(items.map(toResponse));
  },

  async getByReadStatus(
    userId: string,
    status: string
  ): Promise<RecommendationResponse[]> {
    const items = await RecommendationModel.find({
      userId: new Types.ObjectId(userId),
      readStatus: status,
    }).sort({ createdAt: -1 });

    return Promise.all(items.map(toResponse));
  },
};

export default RecommendationModelOps;
