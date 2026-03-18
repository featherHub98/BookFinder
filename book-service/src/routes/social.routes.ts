import { Router } from 'express';
import { SocialController } from '../controllers/Social.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/Auth.middleware';

// Social Routes
const router = Router();

// Likes
// Toggle like on a recommendation
router.post('/like/:recommendationId', authMiddleware, SocialController.toggleLike);

// Toggle like on a comment
router.post('/like/comment/:commentId', authMiddleware, SocialController.toggleCommentLike);

// Comments
// Add a comment
router.post('/comments', authMiddleware, SocialController.addComment);

// Get comments for a recommendation
router.get('/comments/:recommendationId', optionalAuthMiddleware, SocialController.getComments);

// Update a comment
router.put('/comments/:commentId', authMiddleware, SocialController.updateComment);

// Delete a comment
router.delete('/comments/:commentId', authMiddleware, SocialController.deleteComment);

// Shares
// Share a recommendation
router.post('/share', authMiddleware, SocialController.share);

// Follows
// Toggle follow on a user
router.post('/follow/:userId', authMiddleware, SocialController.toggleFollow);

// Get user's followers
router.get('/followers/:userId', optionalAuthMiddleware, SocialController.getFollowers);

// Get users that a user is following
router.get('/following/:userId', optionalAuthMiddleware, SocialController.getFollowing);

// Get suggested users to follow
router.get('/suggested-users', authMiddleware, SocialController.getSuggestedUsers);

// Activity Feed
// Get activity feed for current user
router.get('/feed', authMiddleware, SocialController.getActivityFeed);

// User Preferences
// Get user preferences
router.get('/preferences', authMiddleware, SocialController.getPreferences);

// Update user preferences
router.put('/preferences', authMiddleware, SocialController.updatePreferences);

// Personalized Recommendations
// Get personalized recommendations for current user
router.get('/recommendations', authMiddleware, SocialController.getPersonalizedRecommendations);

// Get trending books
router.get('/trending', optionalAuthMiddleware, SocialController.getTrendingBooks);

// Get similar books to a specific book
router.get('/similar/:bookId', optionalAuthMiddleware, SocialController.getSimilarBooks);

// Admin/Utility
// Sync recommendations counts (fix for existing users)
router.post('/sync-counts', authMiddleware, SocialController.syncRecommendationsCounts);

export default router;
