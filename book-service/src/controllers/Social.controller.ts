import type { Response } from 'express';
import SocialService from '../services/Social.service';
import type { AuthenticatedRequest, ApiResponse } from '../types';

export const SocialController = {
  async toggleLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { recommendationId } = req.params;
      const result = await SocialService.toggleLike(req.user.id, recommendationId);

      res.status(200).json({
        success: true,
        message: result.liked ? 'Recommendation liked' : 'Recommendation unliked',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle like';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async toggleCommentLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { commentId } = req.params;
      const result = await SocialService.toggleCommentLike(req.user.id, commentId);

      res.status(200).json({
        success: true,
        message: result.liked ? 'Comment liked' : 'Comment unliked',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle like';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { recommendationId, content, parentId } = req.body;

      if (!recommendationId || !content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Recommendation ID and content are required',
        } as ApiResponse);
        return;
      }

      const comment = await SocialService.addComment(
        req.user.id,
        recommendationId,
        content.trim(),
        parentId
      );

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SocialService.getComments(recommendationId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Comments retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get comments';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { commentId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Content is required',
        } as ApiResponse);
        return;
      }

      const comment = await SocialService.updateComment(req.user.id, commentId, content.trim());

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update comment';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { commentId } = req.params;
      const { recommendationId } = req.body;

      await SocialService.deleteComment(req.user.id, commentId, recommendationId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async share(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { recommendationId, platform, message } = req.body;

      if (!recommendationId || !platform) {
        res.status(400).json({
          success: false,
          message: 'Recommendation ID and platform are required',
        } as ApiResponse);
        return;
      }

      const share = await SocialService.shareRecommendation(
        req.user.id,
        recommendationId,
        platform,
        message
      );

      res.status(201).json({
        success: true,
        message: 'Shared successfully',
        data: share,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async toggleFollow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { userId } = req.params;
      const result = await SocialService.toggleFollow(req.user.id, userId);

      res.status(200).json({
        success: true,
        message: result.followed ? 'User followed' : 'User unfollowed',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle follow';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getFollowers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const currentUserId = req.user?.id;

      const result = await SocialService.getFollowers(userId, currentUserId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Followers retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get followers';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getFollowing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const currentUserId = req.user?.id;

      const result = await SocialService.getFollowing(userId, currentUserId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Following retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get following';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getSuggestedUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const users = await SocialService.getSuggestedUsers(req.user.id, limit);

      res.status(200).json({
        success: true,
        message: 'Suggested users retrieved',
        data: users,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get suggested users';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getActivityFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SocialService.getActivityFeed(req.user.id, page, limit);

      res.status(200).json({
        success: true,
        message: 'Activity feed retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get activity feed';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const preferences = await SocialService.getUserPreferences(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Preferences retrieved',
        data: preferences,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get preferences';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const preferences = await SocialService.updateUserPreferences(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Preferences updated',
        data: preferences,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update preferences';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getPersonalizedRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const result = await SocialService.getPersonalizedRecommendations(req.user.id, limit);

      res.status(200).json({
        success: true,
        message: 'Personalized recommendations retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get recommendations';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getTrendingBooks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await SocialService.getTrendingBooks(limit);

      res.status(200).json({
        success: true,
        message: 'Trending books retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get trending books';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getSimilarBooks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await SocialService.getSimilarBooks(bookId, limit);

      res.status(200).json({
        success: true,
        message: 'Similar books retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get similar books';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async syncRecommendationsCounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { RecommendationModel, UserModel } = await import('../shared/db');
      
      const userRecommendationCounts = await RecommendationModel.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]);

      const updatePromises = userRecommendationCounts.map(async (item) => {
        await UserModel.findByIdAndUpdate(item._id, { recommendationsCount: item.count });
      });

      await Promise.all(updatePromises);

      res.status(200).json({
        success: true,
        message: `Synced recommendations counts for ${userRecommendationCounts.length} users`,
        data: { usersUpdated: userRecommendationCounts.length },
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync counts';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },
};

export default SocialController;
