import { Router } from 'express';
import bookRoutes from './book.routes';
import recommendationRoutes from './recommendation.routes';
import socialRoutes from './social.routes';

// API Routes
const router = Router();

// Health check
router.get('/health', async (_req, res) => {
  try {
    // Check database connection
    const { isDatabaseConnected } = await import('../shared/db');
    const dbStatus = isDatabaseConnected();
    
    res.status(dbStatus ? 200 : 503).json({
      success: dbStatus,
      message: dbStatus ? 'Book service is running' : 'Database connection failed',
      database: 'MongoDB',
      connected: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Book routes
router.use('/books', bookRoutes);

// Recommendation routes
router.use('/recommendations', recommendationRoutes);

// Social routes (likes, comments, shares, follows)
router.use('/social', socialRoutes);

export default router;
