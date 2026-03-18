import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import routes from './src/routes';
import { connectDatabase } from './src/shared/db';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const app = express();

// Security Middleware
// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health',
});

if (isProduction) {
  app.use('/api/', limiter);
}

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 100, // 10 attempts in production
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS Configuration
// Default allowed origins for Docker networking
const defaultDockerOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://frontend:3000',
  'http://bookworm-frontend:3000',
];

const allowedOrigins = isProduction
  ? (process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.NEXT_PUBLIC_APP_URL,
      ...defaultDockerOrigins
    ].filter(Boolean))
  : defaultDockerOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// Body Parsing
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID and Logging
app.use((req, _res, next) => {
  // Generate request ID
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Request logging
  const startTime = Date.now();
  const logLevel = isProduction ? 'info' : 'debug';
  
  console.log(`[${new Date().toISOString()}] [${logLevel.toUpperCase()}] ${req.method} ${req.path}`);
  
  // Log response time on finish
  _res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      status: _res.statusCode,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id'],
    };
    
    if (_res.statusCode >= 400) {
      console.error(`[${new Date().toISOString()}] [ERROR] ${JSON.stringify(logData)}`);
    } else {
      console.log(`[${new Date().toISOString()}] [INFO] ${JSON.stringify(logData)}`);
    }
  });
  
  next();
});

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Auth Service',
    version: '1.0.0',
    environment: NODE_ENV,
    database: 'MongoDB',
    description: 'Authentication microservice for Book Recommendation App',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      verify: 'GET /api/auth/verify (requires token)',
      me: 'GET /api/auth/me (requires token)',
      logout: 'POST /api/auth/logout (requires token)',
      changePassword: 'PUT /api/auth/password (requires token)',
    },
  });
});

// Error Handling
// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] [ERROR] Request ID: ${req.headers['x-request-id']}`);
  console.error('Error:', err.message);
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'CORS policy violation',
    });
    return;
  }
  
  // Validation error
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: isProduction ? undefined : err.message,
    });
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }
  
  // Generic error
  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
    requestId: req.headers['x-request-id'],
  });
});

// Graceful Shutdown
let server: ReturnType<typeof app.listen>;

async function shutdown(signal: string) {
  console.log(`\n[${new Date().toISOString()}] [INFO] Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log(`[${new Date().toISOString()}] [INFO] HTTP server closed`);
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error(`[${new Date().toISOString()}] [ERROR] Forced shutdown after timeout`);
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start Server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase({
      uri: process.env.MONGODB_URI,
      dbName: 'bookworm',
      useInMemory: !process.env.MONGODB_URI,
    });

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔐 Auth Service started successfully`);
      console.log(`${'='.repeat(50)}`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`${'='.repeat(50)}\n`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
      throw error;
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
