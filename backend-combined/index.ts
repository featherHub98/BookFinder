import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'production';
const isProduction = true;

const JWT_SECRET = process.env.JWT_SECRET || 'bookworm-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS_ENV = process.env.ALLOWED_ORIGINS || '';
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

// Trust proxy for rate limiting behind Render's proxy
app.set('trust proxy', 1);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, default: null },
  avatar: { type: String, default: null },
  bio: { type: String, default: null, maxlength: 500 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  recommendationsCount: { type: Number, default: 0 },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });

UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Book Schema
const BookSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  authors: [{ type: String }],
  description: { type: String },
  thumbnail: { type: String },
  isbn: { type: String },
  publishedDate: { type: String },
  publisher: { type: String },
  pageCount: { type: Number },
  categories: [{ type: String }],
  language: { type: String },
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

// Recommendation Schema
const RecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, maxlength: 2000 },
  status: { type: String, enum: ['reading', 'completed', 'want_to_read'], default: 'completed' },
  isPublic: { type: Boolean, default: true },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
}, { timestamps: true });

RecommendationSchema.index({ userId: 1, bookId: 1 }, { unique: true });

const Recommendation = mongoose.models.Recommendation || mongoose.model('Recommendation', RecommendationSchema);

// Like Schema
const LikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation', required: true },
}, { timestamps: true });

LikeSchema.index({ userId: 1, recommendationId: 1 }, { unique: true });

const Like = mongoose.models.Like || mongoose.model('Like', LikeSchema);

// Comment Schema
const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  likesCount: { type: Number, default: 0 },
}, { timestamps: true });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

// Follow Schema
const FollowSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.models.Follow || mongoose.model('Follow', FollowSchema);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  validate: { trustProxy: false },
});

if (isProduction) {
  app.use('/api/', limiter);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 100,
  message: { success: false, message: 'Too many auth attempts' },
  validate: { trustProxy: false },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS - Always use env vars
const allowedOrigins = ALLOWED_ORIGINS_ENV 
  ? ALLOWED_ORIGINS_ENV.split(',').map(s => s.trim()).filter(Boolean)
  : [FRONTEND_URL];

console.log('Environment check:');
console.log('- NODE_ENV:', NODE_ENV);
console.log('- FRONTEND_URL:', FRONTEND_URL);
console.log('- ALLOWED_ORIGINS:', ALLOWED_ORIGINS_ENV);
console.log('- Parsed allowedOrigins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return origin === allowed || origin.includes(allowed.replace('https://', '').replace('http://', ''));
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(null, true); // Allow anyway for now, log the issue
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    (req as any).user = user.toJSON();
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Cookie Options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 1000,
  path: '/',
};

// ============ HEALTH ============
app.get('/api/health', async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1;
  res.status(dbStatus ? 200 : 503).json({
    success: dbStatus,
    message: dbStatus ? 'All services running' : 'Database disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || null,
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie('auth_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'User registered',
      data: { user: user.toJSON(), token },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie('auth_token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toJSON(), token },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax', path: '/' });
  res.json({ success: true, message: 'Logged out' });
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: (req as any).user });
});

// Verify token
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true, data: (req as any).user });
});

// Change password
app.put('/api/auth/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be 8+ characters' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Update profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, bio } = req.body;
    const userId = (req as any).user._id;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (bio !== undefined) updateData.bio = bio || null;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.json({ success: true, message: 'Profile updated', data: user?.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If account exists, email sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    if (process.env.RESEND_API_KEY) {
      const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: user.email,
        subject: 'Reset Your BookWorm Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">BookWorm</h1>
            <p>Hi ${user.name || 'there'},</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This link expires in 1 hour.</p>
          </div>
        `,
      });
    }

    res.json({ success: true, message: 'If account exists, email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.json({ success: true, message: 'If account exists, email sent' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be 8+ characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Get user by ID
app.get('/api/auth/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        recommendationsCount: user.recommendationsCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// ============ BOOK ROUTES ============

// Search books (Google Books API proxy)
app.get('/api/books/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q as string)}&startIndex=${startIndex}&maxResults=${limit}`;
    if (apiKey) url += `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    const books = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description,
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://'),
      publishedDate: item.volumeInfo?.publishedDate,
      publisher: item.volumeInfo?.publisher,
      pageCount: item.volumeInfo?.pageCount,
      categories: item.volumeInfo?.categories || [],
      language: item.volumeInfo?.language,
    }));

    res.json({
      success: true,
      data: {
        books,
        totalItems: data.totalItems || 0,
        page: Number(page),
        hasMore: startIndex + books.length < (data.totalItems || 0),
      },
    });
  } catch (error) {
    console.error('Book search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get book by ID
app.get('/api/books/:id', async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book && req.params.id.startsWith('google_') === false) {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${req.params.id}`);
      if (response.ok) {
        const data = await response.json();
        book = {
          _id: data.id,
          googleId: data.id,
          title: data.volumeInfo?.title,
          authors: data.volumeInfo?.authors || [],
          description: data.volumeInfo?.description,
          thumbnail: data.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://'),
          publishedDate: data.volumeInfo?.publishedDate,
          publisher: data.volumeInfo?.publisher,
          pageCount: data.volumeInfo?.pageCount,
          categories: data.volumeInfo?.categories || [],
        } as any;
      }
    }

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get book' });
  }
});

// ============ RECOMMENDATION ROUTES ============

// Get my recommendations
app.get('/api/recommendations/my', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const recommendations = await Recommendation.find({ userId })
      .populate('bookId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
});

// Get public feed
app.get('/api/recommendations/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const recommendations = await Recommendation.find({ isPublic: true })
      .populate('userId', 'name avatar')
      .populate('bookId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get feed' });
  }
});

// Add recommendation
app.post('/api/recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { bookId, bookData, rating, review, status, isPublic } = req.body;

    if (!bookId && !bookData) {
      return res.status(400).json({ success: false, message: 'Book ID or data required' });
    }

    let book;
    if (bookId) {
      book = await Book.findById(bookId);
    } else if (bookData) {
      book = await Book.findOneAndUpdate(
        { googleId: bookData.googleId },
        { $setOnInsert: bookData },
        { upsert: true, new: true }
      );
    }

    if (!book) {
      return res.status(400).json({ success: false, message: 'Book not found' });
    }

    const existing = await Recommendation.findOne({ userId, bookId: book._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already recommended' });
    }

    const recommendation = await Recommendation.create({
      userId,
      bookId: book._id,
      rating,
      review,
      status: status || 'completed',
      isPublic: isPublic !== false,
    });

    await User.findByIdAndUpdate(userId, { $inc: { recommendationsCount: 1 } });

    res.status(201).json({ success: true, data: await recommendation.populate('bookId') });
  } catch (error) {
    console.error('Add recommendation error:', error);
    res.status(500).json({ success: false, message: 'Failed to add recommendation' });
  }
});

// ============ SOCIAL ROUTES ============

// Toggle like
app.post('/api/social/like/:recommendationId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { recommendationId } = req.params;

    const existing = await Like.findOne({ userId, recommendationId });

    if (existing) {
      await Like.deleteOne({ _id: existing._id });
      await Recommendation.findByIdAndUpdate(recommendationId, { $inc: { likesCount: -1 } });
      res.json({ success: true, data: { liked: false } });
    } else {
      await Like.create({ userId, recommendationId });
      await Recommendation.findByIdAndUpdate(recommendationId, { $inc: { likesCount: 1 } });
      res.json({ success: true, data: { liked: true } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

// Toggle follow
app.post('/api/social/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const followerId = (req as any).user._id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const existing = await Follow.findOne({ followerId, followingId });

    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
      res.json({ success: true, data: { following: false } });
    } else {
      await Follow.create({ followerId, followingId });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
      res.json({ success: true, data: { following: true } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle follow' });
  }
});

// Get followers
app.get('/api/social/followers/:userId', async (req, res) => {
  try {
    const follows = await Follow.find({ followingId: req.params.userId })
      .populate('followerId', 'name avatar bio recommendationsCount')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: follows.map(f => f.followerId) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get followers' });
  }
});

// Get following
app.get('/api/social/following/:userId', async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.params.userId })
      .populate('followingId', 'name avatar bio recommendationsCount')
      .sort({ createdAt: -1 });

    const users = follows.map(f => f.followingId);
    
    for (const user of users) {
      const count = await Recommendation.countDocuments({ userId: user._id, isPublic: true });
      (user as any).recommendationsCount = count;
    }

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get following' });
  }
});

// Add comment
app.post('/api/social/comments', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { recommendationId, content } = req.body;

    if (!content || !recommendationId) {
      return res.status(400).json({ success: false, message: 'Content and recommendation required' });
    }

    const comment = await Comment.create({ userId, recommendationId, content });
    await Recommendation.findByIdAndUpdate(recommendationId, { $inc: { commentsCount: 1 } });

    res.status(201).json({ success: true, data: await comment.populate('userId', 'name avatar') });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// Get comments
app.get('/api/social/comments/:recommendationId', async (req, res) => {
  try {
    const comments = await Comment.find({ recommendationId: req.params.recommendationId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get comments' });
  }
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'BookWorm API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: 'GET /api/health',
      auth: '/api/auth/*',
      books: '/api/books/*',
      recommendations: '/api/recommendations/*',
      social: '/api/social/*',
    },
  });
});

// Error handlers
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BookWorm API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
