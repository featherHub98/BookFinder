import { Router } from 'express';
import authRoutes from './auth.routes';

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
      message: dbStatus ? 'Auth service is running' : 'Database connection failed',
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

// Auth routes
router.use('/auth', authRoutes);

export default router;
