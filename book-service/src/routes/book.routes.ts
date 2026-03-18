import { Router } from 'express';
import BookController from '../controllers/Book.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/Auth.middleware';

// Book Routes
const router = Router();

// Public routes
router.get('/search', BookController.search);
router.get('/feed', BookController.getPublicFeed);
router.get('/:id', BookController.getBook);

// Book details with optional auth (to show user's rating if logged in)
router.get('/:id/details', optionalAuthMiddleware, BookController.getBookDetails);

// Protected routes (require authentication)
router.post('/manual', authMiddleware, BookController.createManualBook);

export default router;
