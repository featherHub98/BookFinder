// Book API - Frontend API calls to Book Service
const BOOK_SERVICE_PORT = '3002';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface Book {
  _id: string;
  id?: string;
  title: string;
  author: string;
  isbn: string | null;
  openLibraryId: string | null;
  description: string | null;
  coverImage: string | null;
  publisher: string | null;
  publishYear: number | null;
  pageCount: number | null;
  genres: string[];
  averageRating: number;
  ratingsCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  _id: string;
  id?: string;
  userId: string;
  bookId: string;
  rating: number;
  review: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  readStatus: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
  book?: Book;
  user?: {
    _id: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface BookDetails {
  book: Book;
  userRating: Recommendation | null;
  publicReviews: Array<{
    _id: string;
    rating: number;
    review: string | null;
    createdAt: string;
    userId: string;
    user?: {
      _id: string;
      name: string | null;
      avatar: string | null;
    };
  }>;
  stats: {
    totalRatings: number;
    averageRating: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

export interface Comment {
  _id: string;
  userId: string;
  recommendationId: string;
  parentId: string | null;
  content: string;
  isEdited: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name: string | null;
    avatar: string | null;
  };
  replies?: Comment[];
}

export interface UserProfile {
  _id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  recommendationsCount: number;
  isFollowing?: boolean;
}

export interface UserPreferences {
  _id: string;
  userId: string;
  favoriteGenres: string[];
  favoriteAuthors: string[];
  preferredLanguages: string[];
  readingGoals: {
    booksPerYear: number;
    currentYear: number;
    booksReadThisYear: number;
  };
  notificationSettings: {
    newFollower: boolean;
    newComment: boolean;
    newLike: boolean;
    recommendations: boolean;
  };
}

export interface RecommendedBook {
  book: Book;
  score: number;
  reasons: string[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface SearchBooksResponse {
  items: Book[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AddRecommendationInput {
  bookId: string;
  rating: number;
  review?: string;
  isPublic?: boolean;
  readStatus?: 'read' | 'reading' | 'want_to_read';
}

export interface UpdateRecommendationInput {
  rating?: number;
  review?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  readStatus?: 'read' | 'reading' | 'want_to_read';
}

// Helper function for API calls
async function bookFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Build URL with XTransformPort query parameter
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `/api${endpoint}${separator}XTransformPort=${BOOK_SERVICE_PORT}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Auth is now handled via HTTP-only cookies only (more secure)
  // No localStorage token needed

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important: include HTTP-only cookies
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

// Book API Functions
export const bookApi = {
  // Books
  async search(query: string, page: number = 1, limit: number = 10): Promise<ApiResponse<SearchBooksResponse>> {
    return bookFetch<SearchBooksResponse>(
      `/books/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  },

  async getBook(id: string): Promise<ApiResponse<Book>> {
    return bookFetch<Book>(`/books/${id}`);
  },

  async getBookDetails(id: string): Promise<ApiResponse<BookDetails>> {
    return bookFetch<BookDetails>(`/books/${id}/details`);
  },

  // Recommendations
  async addRecommendation(input: AddRecommendationInput): Promise<ApiResponse<Recommendation>> {
    return bookFetch<Recommendation>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateRecommendation(id: string, input: UpdateRecommendationInput): Promise<ApiResponse<Recommendation>> {
    return bookFetch<Recommendation>(`/recommendations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteRecommendation(id: string): Promise<ApiResponse> {
    return bookFetch(`/recommendations/${id}`, { method: 'DELETE' });
  },

  async getMyRecommendations(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    return bookFetch<PaginatedResponse<Recommendation>>(`/recommendations/my?page=${page}&limit=${limit}`);
  },

  async getPublicFeed(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    return bookFetch<PaginatedResponse<Recommendation>>(`/recommendations/feed?page=${page}&limit=${limit}`);
  },

  async getFavorites(): Promise<ApiResponse<Recommendation[]>> {
    return bookFetch<Recommendation[]>('/recommendations/favorites');
  },

  async getByStatus(status: 'read' | 'reading' | 'want_to_read'): Promise<ApiResponse<Recommendation[]>> {
    return bookFetch<Recommendation[]>(`/recommendations/status/${status}`);
  },

  // Likes
  async toggleLike(recommendationId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return bookFetch<{ liked: boolean; likesCount: number }>(`/social/like/${recommendationId}`, { method: 'POST' });
  },

  async toggleCommentLike(commentId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return bookFetch<{ liked: boolean; likesCount: number }>(`/social/like/comment/${commentId}`, { method: 'POST' });
  },

  // Comments
  async addComment(recommendationId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> {
    return bookFetch<Comment>('/social/comments', {
      method: 'POST',
      body: JSON.stringify({ recommendationId, content, parentId }),
    });
  },

  async getComments(recommendationId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    return bookFetch<PaginatedResponse<Comment>>(`/social/comments/${recommendationId}?page=${page}&limit=${limit}`);
  },

  async updateComment(commentId: string, content: string): Promise<ApiResponse<Comment>> {
    return bookFetch<Comment>(`/social/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(commentId: string, recommendationId: string): Promise<ApiResponse> {
    return bookFetch(`/social/comments/${commentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ recommendationId }),
    });
  },

  // Shares
  async shareRecommendation(
    recommendationId: string,
    platform: 'internal' | 'twitter' | 'facebook' | 'linkedin' | 'copy_link',
    message?: string
  ): Promise<ApiResponse<{ _id: string; platform: string }>> {
    return bookFetch<{ _id: string; platform: string }>('/social/share', {
      method: 'POST',
      body: JSON.stringify({ recommendationId, platform, message }),
    });
  },

  // Follows
  async toggleFollow(userId: string): Promise<ApiResponse<{ followed: boolean }>> {
    return bookFetch<{ followed: boolean }>(`/social/follow/${userId}`, { method: 'POST' });
  },

  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<UserProfile>>> {
    return bookFetch<PaginatedResponse<UserProfile>>(`/social/followers/${userId}?page=${page}&limit=${limit}`);
  },

  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<UserProfile>>> {
    return bookFetch<PaginatedResponse<UserProfile>>(`/social/following/${userId}?page=${page}&limit=${limit}`);
  },

  async getSuggestedUsers(limit: number = 5): Promise<ApiResponse<UserProfile[]>> {
    return bookFetch<UserProfile[]>(`/social/suggested-users?limit=${limit}`);
  },

  // Activity Feed
  async getActivityFeed(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    return bookFetch<PaginatedResponse<Recommendation>>(`/social/feed?page=${page}&limit=${limit}`);
  },

  // User Preferences
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    return bookFetch<UserPreferences>('/social/preferences');
  },

  async updateUserPreferences(data: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    return bookFetch<UserPreferences>('/social/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Personalized Recommendations
  async getPersonalizedRecommendations(limit: number = 10): Promise<ApiResponse<{ items: RecommendedBook[] }>> {
    return bookFetch<{ items: RecommendedBook[] }>(`/social/recommendations?limit=${limit}`);
  },

  async getTrendingBooks(limit: number = 10): Promise<ApiResponse<{ items: RecommendedBook[] }>> {
    return bookFetch<{ items: RecommendedBook[] }>(`/social/trending?limit=${limit}`);
  },

  async getSimilarBooks(bookId: string, limit: number = 5): Promise<ApiResponse<{ items: RecommendedBook[] }>> {
    return bookFetch<{ items: RecommendedBook[] }>(`/social/similar/${bookId}?limit=${limit}`);
  },
};

export default bookApi;
