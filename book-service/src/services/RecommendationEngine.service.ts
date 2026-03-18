import { RecommendationModel, BookModel, UserModel, FollowModel, UserPreferencesModel } from '../shared/db';
import { Types } from 'mongoose';

// Recommendation Engine - Personalized Book Recommendations
interface RecommendedBook {
  bookId: Types.ObjectId;
  score: number;
  reasons: string[];
}

interface UserInterests {
  genres: Map<string, number>;
  authors: Map<string, number>;
  avgRating: number;
  totalBooks: number;
}

export const RecommendationEngine = {
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<{
    items: Array<{
      book: unknown;
      score: number;
      reasons: string[];
    }>;
  }> {
    // Get user's reading history
    const userRecommendations = await RecommendationModel.find({
      userId: new Types.ObjectId(userId),
    }).populate('bookId');

    if (userRecommendations.length === 0) {
      // New user - return popular books
      return this.getPopularBooks(limit);
    }

    // Extract user interests from reading history
    const interests = this.extractUserInterests(userRecommendations);

    // Get books user has already rated
    const ratedBookIds = userRecommendations.map(r => r.bookId);

    // Get recommendations from multiple sources
    const recommendations: RecommendedBook[] = [];

    // 1. Content-based: Books similar to what user has liked
    const contentBased = await this.getContentBasedRecommendations(
      interests,
      ratedBookIds,
      Math.ceil(limit * 0.4)
    );
    recommendations.push(...contentBased);

    // 2. Collaborative: Books liked by similar users
    const collaborative = await this.getCollaborativeRecommendations(
      userId,
      ratedBookIds,
      interests,
      Math.ceil(limit * 0.3)
    );
    recommendations.push(...collaborative);

    // 3. Social: Books from followed users
    const social = await this.getSocialRecommendations(
      userId,
      ratedBookIds,
      Math.ceil(limit * 0.3)
    );
    recommendations.push(...social);

    // Sort by score and remove duplicates
    const uniqueRecommendations = this.deduplicateAndSort(recommendations, limit);

    // Fetch book details
    const bookIds = uniqueRecommendations.map(r => r.bookId);
    const books = await BookModel.find({ _id: { $in: bookIds } });

    const bookMap = new Map(books.map(b => [b._id.toString(), b]));

    return {
      items: uniqueRecommendations.map(rec => ({
        book: bookMap.get(rec.bookId.toString()),
        score: rec.score,
        reasons: rec.reasons,
      })).filter(item => item.book),
    };
  },

  extractUserInterests(recommendations: unknown[]): UserInterests {
    const genres = new Map<string, number>();
    const authors = new Map<string, number>();
    let totalRating = 0;
    let ratedBooks = 0;

    for (const rec of recommendations as Array<{ bookId: unknown; rating: number }>) {
      const book = rec.bookId as { genres?: string[]; author?: string };
      
      // Weight genres by rating (higher rated books have more influence)
      const weight = rec.rating / 5;
      
      if (book.genres) {
        for (const genre of book.genres) {
          genres.set(genre, (genres.get(genre) || 0) + weight);
        }
      }

      if (book.author) {
        authors.set(book.author, (authors.get(book.author) || 0) + weight);
      }

      totalRating += rec.rating;
      ratedBooks++;
    }

    return {
      genres,
      authors,
      avgRating: ratedBooks > 0 ? totalRating / ratedBooks : 0,
      totalBooks: ratedBooks,
    };
  },

  async getContentBasedRecommendations(
    interests: UserInterests,
    excludeBookIds: Types.ObjectId[],
    limit: number
  ): Promise<RecommendedBook[]> {
    const topGenres = Array.from(interests.genres.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    const topAuthors = Array.from(interests.authors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([author]) => author);

    if (topGenres.length === 0 && topAuthors.length === 0) {
      return [];
    }

    const recommendations: RecommendedBook[] = [];

    // Find books by favorite genres
    if (topGenres.length > 0) {
      const genreBooks = await BookModel.find({
        _id: { $nin: excludeBookIds },
        genres: { $in: topGenres },
      })
        .sort({ averageRating: -1, ratingsCount: -1 })
        .limit(limit);

      for (const book of genreBooks) {
        const matchingGenres = (book.genres || []).filter(g => topGenres.includes(g));
        const score = 0.4 + (matchingGenres.length * 0.15);
        recommendations.push({
          bookId: book._id,
          score,
          reasons: [`Matches your interest in ${matchingGenres.slice(0, 2).join(', ')}`],
        });
      }
    }

    // Find books by favorite authors
    if (topAuthors.length > 0) {
      const authorBooks = await BookModel.find({
        _id: { $nin: excludeBookIds },
        author: { $in: topAuthors },
      })
        .sort({ averageRating: -1 })
        .limit(Math.ceil(limit / 2));

      for (const book of authorBooks) {
        recommendations.push({
          bookId: book._id,
          score: 0.6,
          reasons: [`By ${book.author}, one of your favorite authors`],
        });
      }
    }

    return recommendations;
  },

  async getCollaborativeRecommendations(
    userId: string,
    excludeBookIds: Types.ObjectId[],
    interests: UserInterests,
    limit: number
  ): Promise<RecommendedBook[]> {
    // Find users with similar tastes
    const topGenres = Array.from(interests.genres.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Find users who rated books in these genres highly
    const similarUserRatings = await RecommendationModel.aggregate([
      {
        $match: {
          userId: { $ne: new Types.ObjectId(userId) },
          rating: { $gte: 4 },
        },
      },
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      {
        $unwind: '$book',
      },
      {
        $match: {
          'book.genres': { $in: topGenres },
          bookId: { $nin: excludeBookIds },
        },
      },
      {
        $group: {
          _id: '$bookId',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      {
        $sort: { count: -1, avgRating: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    return similarUserRatings.map(item => ({
      bookId: item._id,
      score: 0.3 + (item.count * 0.05) + (item.avgRating * 0.05),
      reasons: [`Highly rated by ${item.count} similar readers`],
    }));
  },

  async getSocialRecommendations(
    userId: string,
    excludeBookIds: Types.ObjectId[],
    limit: number
  ): Promise<RecommendedBook[]> {
    // Get users that current user follows
    const following = await FollowModel.find({
      followerId: new Types.ObjectId(userId),
    }).select('followingId');

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Get books rated highly by followed users
    const socialRecs = await RecommendationModel.find({
      userId: { $in: followingIds },
      bookId: { $nin: excludeBookIds },
      rating: { $gte: 4 },
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name');

    const seenBooks = new Set<string>();
    const recommendations: RecommendedBook[] = [];

    for (const rec of socialRecs) {
      const bookIdStr = rec.bookId.toString();
      if (!seenBooks.has(bookIdStr)) {
        seenBooks.add(bookIdStr);
        const user = rec.userId as { name?: string };
        recommendations.push({
          bookId: rec.bookId,
          score: 0.5,
          reasons: [`${user?.name || 'Someone you follow'} rated this ${rec.rating}/5`],
        });
      }
    }

    return recommendations;
  },

  async getPopularBooks(limit: number): Promise<{
    items: Array<{
      book: unknown;
      score: number;
      reasons: string[];
    }>;
  }> {
    const books = await BookModel.find({
      ratingsCount: { $gt: 0 },
    })
      .sort({ ratingsCount: -1, averageRating: -1 })
      .limit(limit);

    return {
      items: books.map((book, index) => ({
        book,
        score: 1 - (index * 0.05),
        reasons: ['Popular among BookWorm readers'],
      })),
    };
  },

  deduplicateAndSort(recommendations: RecommendedBook[], limit: number): RecommendedBook[] {
    const seen = new Map<string, RecommendedBook>();

    for (const rec of recommendations) {
      const key = rec.bookId.toString();
      if (seen.has(key)) {
        // Merge scores and reasons
        const existing = seen.get(key)!;
        existing.score = Math.max(existing.score, rec.score);
        existing.reasons = [...new Set([...existing.reasons, ...rec.reasons])];
      } else {
        seen.set(key, { ...rec });
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  async getTrendingBooks(limit: number = 10): Promise<{
    items: Array<{
      book: unknown;
      score: number;
      reasons: string[];
    }>;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await RecommendationModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          isPublic: true,
        },
      },
      {
        $group: {
          _id: '$bookId',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$count', 2] },
              { $multiply: ['$totalLikes', 0.5] },
              { $multiply: ['$totalComments', 0.3] },
              { $multiply: ['$avgRating', 0.5] },
            ],
          },
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const bookIds = trending.map(t => t._id);
    const books = await BookModel.find({ _id: { $in: bookIds } });
    const bookMap = new Map(books.map(b => [b._id.toString(), b]));

    return {
      items: trending.map(item => ({
        book: bookMap.get(item._id.toString()),
        score: item.score,
        reasons: [`Trending with ${item.count} readers this month`],
      })).filter(item => item.book),
    };
  },

  async getSimilarBooks(bookId: string, limit: number = 5): Promise<{
    items: Array<{
      book: unknown;
      score: number;
      reasons: string[];
    }>;
  }> {
    const book = await BookModel.findById(bookId);
    if (!book) {
      return { items: [] };
    }

    // Find books with similar genres and/or author
    const similarBooks = await BookModel.find({
      _id: { $ne: new Types.ObjectId(bookId) },
      $or: [
        { genres: { $in: book.genres } },
        { author: book.author },
      ],
    })
      .sort({ averageRating: -1 })
      .limit(limit * 2);

    // Score based on similarity
    const scoredBooks = similarBooks.map(similarBook => {
      let score = 0;
      const reasons: string[] = [];

      // Same author
      if (similarBook.author === book.author) {
        score += 0.4;
        reasons.push(`Same author as ${book.title}`);
      }

      // Shared genres
      const sharedGenres = (similarBook.genres || []).filter(g => 
        (book.genres || []).includes(g)
      );
      if (sharedGenres.length > 0) {
        score += 0.2 + (sharedGenres.length * 0.1);
        reasons.push(`Similar genres: ${sharedGenres.slice(0, 2).join(', ')}`);
      }

      return {
        book: similarBook,
        score,
        reasons: reasons.length > 0 ? reasons : ['Similar to this book'],
      };
    });

    return {
      items: scoredBooks
        .sort((a, b) => b.score - a.score)
        .slice(0, limit),
    };
  },
};

export default RecommendationEngine;
