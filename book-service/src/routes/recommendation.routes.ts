import { Router } from 'express';
import { RecommendationController } from '../controllers/Recommendation.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/Auth.middleware';

// Recommendation Routes
const router = Router();

// All recommendation routes require authentication
router.post('/', authMiddleware, RecommendationController.add);
router.put('/:id', authMiddleware, RecommendationController.update);
router.delete('/:id', authMiddleware, RecommendationController.delete);

// Get user's recommendations
router.get('/my', authMiddleware, RecommendationController.getMy);
router.get('/favorites', authMiddleware, RecommendationController.getFavorites);
router.get('/status/:status', authMiddleware, RecommendationController.getByStatus);

// Public feed
router.get('/feed', RecommendationController.getPublicFeed);

export default router;
