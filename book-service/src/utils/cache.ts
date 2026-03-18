// Simple In-Memory Cache for Performance Optimization

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Cache key generators
export const CacheKeys = {
  personalizedRecommendations: (userId: string) => `recs:user:${userId}`,
  trendingBooks: () => 'books:trending',
  similarBooks: (bookId: string) => `books:similar:${bookId}`,
  userPreferences: (userId: string) => `prefs:user:${userId}`,
  activityFeed: (userId: string, page: number) => `feed:${userId}:${page}`,
  publicFeed: (page: number) => `feed:public:${page}`,
  userFollowers: (userId: string) => `followers:${userId}`,
  userFollowing: (userId: string) => `following:${userId}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - for recommendations
  LONG: 900,           // 15 minutes - for user preferences
  VERY_LONG: 3600,     // 1 hour - for trending/similar books
};

export default cache;
