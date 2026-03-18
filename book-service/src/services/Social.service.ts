import { LikeModelOps } from '../models/Like.model';
import { CommentModelOps } from '../models/Comment.model';
import { ShareModelOps } from '../models/Share.model';
import { FollowModelOps } from '../models/Follow.model';
import { UserPreferencesModelOps } from '../models/UserPreferences.model';
import { RecommendationModel } from '../shared/db';
import { RecommendationEngine } from './RecommendationEngine.service';
import { Types } from 'mongoose';

// Social Service - Business Logic for Social Features
export const SocialService = {
  // ============================================
  // Likes
  // ============================================
  
  async toggleLike(userId: string, recommendationId: string): Promise<{
    liked: boolean;
    likesCount: number;
  }> {
    const result = await LikeModelOps.toggle(userId, recommendationId, 'recommendation');
    
    // Update recommendation likes count
    const increment = result.liked ? 1 : -1;
    await RecommendationModel.findByIdAndUpdate(recommendationId, {
      $inc: { likesCount: increment },
    });
    
    const likesCount = await LikeModelOps.getCount(recommendationId, 'recommendation');
    
    return {
      liked: result.liked,
      likesCount,
    };
  },

  async toggleCommentLike(userId: string, commentId: string): Promise<{
    liked: boolean;
    likesCount: number;
  }> {
    const result = await LikeModelOps.toggle(userId, commentId, 'comment');
    
    // Update comment likes count
    if (result.liked) {
      const { CommentModelOps } = await import('../models/Comment.model');
      await CommentModelOps.incrementLikes(commentId);
    } else {
      const { CommentModelOps } = await import('../models/Comment.model');
      await CommentModelOps.decrementLikes(commentId);
    }
    
    const likesCount = await LikeModelOps.getCount(commentId, 'comment');
    
    return {
      liked: result.liked,
      likesCount,
    };
  },

  async checkLikes(userId: string, recommendationIds: string[]): Promise<Map<string, boolean>> {
    return LikeModelOps.getLikesForTargets(
      userId,
      recommendationIds.map(id => ({ id, type: 'recommendation' as const }))
    );
  },

  // ============================================
  // Comments
  // ============================================
  
  async addComment(
    userId: string,
    recommendationId: string,
    content: string,
    parentId?: string
  ) {
    // Verify recommendation exists and is public
    const recommendation = await RecommendationModel.findById(recommendationId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    const comment = await CommentModelOps.create(userId, recommendationId, content, parentId);
    
    // Update recommendation comments count
    await RecommendationModel.findByIdAndUpdate(recommendationId, {
      $inc: { commentsCount: 1 },
    });
    
    return comment;
  },

  async getComments(recommendationId: string, page: number = 1, limit: number = 20) {
    return CommentModelOps.getByRecommendation(recommendationId, page, limit);
  },

  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await CommentModelOps.update(commentId, userId, content);
    if (!comment) {
      throw new Error('Comment not found or not authorized');
    }
    return comment;
  },

  async deleteComment(userId: string, commentId: string, recommendationId: string): Promise<void> {
    const deleted = await CommentModelOps.delete(commentId, userId);
    if (!deleted) {
      throw new Error('Comment not found or not authorized');
    }
    
    // Update recommendation comments count
    await RecommendationModel.findByIdAndUpdate(recommendationId, {
      $inc: { commentsCount: -1 },
    });
  },

  // ============================================
  // Shares
  // ============================================
  
  async shareRecommendation(
    userId: string,
    recommendationId: string,
    platform: 'internal' | 'twitter' | 'facebook' | 'linkedin' | 'copy_link',
    message?: string
  ) {
    // Verify recommendation exists
    const recommendation = await RecommendationModel.findById(recommendationId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    const share = await ShareModelOps.create(userId, recommendationId, platform, message);
    
    // Update recommendation shares count
    await RecommendationModel.findByIdAndUpdate(recommendationId, {
      $inc: { sharesCount: 1 },
    });
    
    return share;
  },

  async getShares(recommendationId: string, page: number = 1, limit: number = 20) {
    return ShareModelOps.getByRecommendation(recommendationId, page, limit);
  },

  // ============================================
  // Follows
  // ============================================
  
  async toggleFollow(followerId: string, followingId: string) {
    return FollowModelOps.toggle(followerId, followingId);
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return FollowModelOps.isFollowing(followerId, followingId);
  },

  async getFollowers(userId: string, currentUserId?: string, page: number = 1, limit: number = 20) {
    return FollowModelOps.getFollowers(userId, currentUserId, page, limit);
  },

  async getFollowing(userId: string, currentUserId?: string, page: number = 1, limit: number = 20) {
    return FollowModelOps.getFollowing(userId, currentUserId, page, limit);
  },

  async getSuggestedUsers(userId: string, limit: number = 5) {
    return FollowModelOps.getSuggested(userId, limit);
  },

  // ============================================
  // User Preferences
  // ============================================
  
  async getUserPreferences(userId: string) {
    return UserPreferencesModelOps.getOrCreate(userId);
  },

  async updateUserPreferences(
    userId: string,
    data: Parameters<typeof UserPreferencesModelOps.update>[1]
  ) {
    return UserPreferencesModelOps.update(userId, data);
  },

  // ============================================
  // Activity Feed
  // ============================================
  
  async getActivityFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: Array<{
      _id: string;
      userId: Types.ObjectId;
      bookId: Types.ObjectId;
      rating: number;
      review: string | null;
      readStatus: string;
      likesCount: number;
      commentsCount: number;
      sharesCount: number;
      createdAt: Date;
      isLiked?: boolean;
      book?: {
        _id: Types.ObjectId;
        title: string;
        author: string;
        coverImage: string | null;
      };
      user?: {
        _id: Types.ObjectId;
        name: string | null;
        avatar: string | null;
      };
    }>;
    total: number;
    hasMore: boolean;
  }> {
    // Get users that current user follows
    const { FollowModel, BookModel, UserModel } = await import('../shared/db');
    const following = await FollowModel.find({
      followerId: new Types.ObjectId(userId),
    }).select('followingId');

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return { items: [], total: 0, hasMore: false };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RecommendationModel.find({
        userId: { $in: followingIds },
        isPublic: true,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RecommendationModel.countDocuments({
        userId: { $in: followingIds },
        isPublic: true,
      }),
    ]);

    // Check if user has liked each recommendation
    const likesMap = await LikeModelOps.getLikesForTargets(
      userId,
      items.map(item => ({ id: item._id.toString(), type: 'recommendation' as const }))
    );

    // Get book and user info for each recommendation
    const itemsWithDetails = await Promise.all(items.map(async (item) => {
      const [book, user] = await Promise.all([
        BookModel.findById(item.bookId).select('title author coverImage'),
        UserModel.findById(item.userId).select('name avatar'),
      ]);

      return {
        _id: item._id.toString(),
        userId: item.userId,
        bookId: item.bookId,
        rating: item.rating,
        review: item.review,
        readStatus: item.readStatus,
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        sharesCount: item.sharesCount,
        createdAt: item.createdAt,
        isLiked: likesMap.get(item._id.toString()) || false,
        book: book ? {
          _id: book._id,
          title: book.title,
          author: book.author,
          coverImage: book.coverImage,
        } : undefined,
        user: user ? {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        } : undefined,
      };
    }));

    return {
      items: itemsWithDetails,
      total,
      hasMore: skip + items.length < total,
    };
  },

  // ============================================
  // Personalized Recommendations
  // ============================================
  
  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    return RecommendationEngine.getPersonalizedRecommendations(userId, limit);
  },

  async getTrendingBooks(limit: number = 10) {
    return RecommendationEngine.getTrendingBooks(limit);
  },

  async getSimilarBooks(bookId: string, limit: number = 5) {
    return RecommendationEngine.getSimilarBooks(bookId, limit);
  },
};

export default SocialService;
