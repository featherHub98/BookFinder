import BookModelOps from '../models/Book.model';
import RecommendationModelOps from '../models/Recommendation.model';
import type {
  BookResponse,
  CreateBookInput,
  RecommendationResponse,
  PaginatedResponse,
  OpenLibrarySearchResponse,
  OpenLibrarySearchResult,
} from '../types';

// Configuration
const OPEN_LIBRARY_BASE_URL = process.env.OPEN_LIBRARY_BASE_URL || 'https://openlibrary.org';

// Helper: Transform Open Library result to Book data
function transformOpenLibraryResult(doc: OpenLibrarySearchResult): CreateBookInput | null {
  // Skip books without title (required field)
  if (!doc.title) {
    return null;
  }

  // Get cover image URL
  let coverImage: string | undefined;
  if (doc.cover_i) {
    coverImage = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  } else if (doc.cover_edition_key) {
    coverImage = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
  }

  // Extract Open Library work ID from key
  const openLibraryId = doc.key?.replace('/works/', '') || undefined;

  return {
    title: doc.title,
    author: doc.author_name?.join(', ') || 'Unknown Author',
    isbn: doc.isbn?.[0],
    openLibraryId,
    coverImage,
    publisher: doc.publisher?.[0],
    publishYear: doc.first_publish_year,
    pageCount: doc.number_of_pages_median,
    genres: doc.subject?.slice(0, 5) || [],
  };
}

// Book Details Response Type
export interface BookDetailsResponse {
  book: BookResponse;
  userRating: RecommendationResponse | null;
  publicReviews: Array<{
    _id: string;
    rating: number;
    review: string | null;
    createdAt: Date;
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

// Book Service - Business Logic
export const BookService = {
  async searchOpenLibrary(
    query: string,
    limit: number = 10,
    page: number = 1,
    field?: string
  ): Promise<PaginatedResponse<BookResponse>> {
    const offset = (page - 1) * limit;
    
    // Build search URL
    let searchUrl = `${OPEN_LIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
    
    // Add field-specific search if provided
    if (field) {
      searchUrl = `${OPEN_LIBRARY_BASE_URL}/search.json?${field}=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
    }

    try {
      console.log(`[BookService] Searching Open Library: ${searchUrl}`);
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status}`);
      }

      const data: OpenLibrarySearchResponse = await response.json();
      console.log(`[BookService] Found ${data.numFound} books, processing ${data.docs?.length || 0} docs`);

      // Transform results and save to database
      const books: BookResponse[] = [];
      
      if (data.docs && Array.isArray(data.docs)) {
        for (const doc of data.docs) {
          try {
            const bookData = transformOpenLibraryResult(doc);
            
            // Skip if transformation returned null (missing required fields)
            if (!bookData) {
              console.log(`[BookService] Skipping book without title: ${doc.key}`);
              continue;
            }
            
            const book = await BookModelOps.findOrCreateFromOpenLibrary(bookData);
            books.push(book);
          } catch (error) {
            console.error('[BookService] Error saving book:', error);
            // Continue with other books even if one fails
          }
        }
      }

      console.log(`[BookService] Successfully processed ${books.length} books`);
      
      return {
        items: books,
        total: data.numFound || 0,
        page,
        limit,
        hasMore: offset + books.length < (data.numFound || 0),
      };
    } catch (error) {
      console.error('[BookService] Open Library search error:', error);
      throw new Error('Failed to search books. Please try again.');
    }
  },

  async getBookById(id: string): Promise<BookResponse | null> {
    return BookModelOps.findById(id);
  },

  async getBookWithDetails(bookId: string, userId?: string): Promise<BookDetailsResponse | null> {
    const book = await BookModelOps.findById(bookId);
    if (!book) return null;

    // Get user's rating if authenticated
    let userRating: RecommendationResponse | null = null;
    if (userId) {
      userRating = await RecommendationModelOps.findByUserAndBook(userId, bookId);
    }

    // Get public reviews (limit to 10 most recent)
    const publicReviews = await RecommendationModelOps.getPublicByBookId(bookId, 10);

    // Get rating statistics
    const stats = await RecommendationModelOps.getRatingStats(bookId);

    return {
      book,
      userRating,
      publicReviews: publicReviews.map(r => ({
        _id: r._id?.toString() || '',
        rating: r.rating,
        review: r.review,
        createdAt: r.createdAt,
        userId: r.userId.toString(),
        user: r.user ? {
          _id: r.user._id.toString(),
          name: r.user.name,
          avatar: r.user.avatar,
        } : undefined,
      })),
      stats,
    };
  },

  async getPublicRecommendations(page: number = 1, limit: number = 20) {
    return RecommendationModelOps.getPublic(page, limit);
  },

  async addRecommendation(
    userId: string,
    input: { bookId: string; rating: number; review?: string; isPublic?: boolean; readStatus?: string }
  ): Promise<RecommendationResponse> {
    // Check if book exists
    const book = await BookModelOps.findById(input.bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // Check if user already recommended this book
    const existing = await RecommendationModelOps.findByUserAndBook(userId, input.bookId);
    if (existing) {
      throw new Error('You have already recommended this book. You can update your existing recommendation.');
    }

    // Create recommendation
    const recommendation = await RecommendationModelOps.create(userId, {
      bookId: input.bookId,
      rating: input.rating,
      review: input.review,
      isPublic: input.isPublic,
      readStatus: input.readStatus,
    });

    // Update book rating
    await BookModelOps.updateRating(input.bookId, input.rating);

    return recommendation;
  },

  async updateRecommendation(
    recommendationId: string,
    userId: string,
    data: Partial<{
      rating: number;
      review: string;
      isPublic: boolean;
      isFavorite: boolean;
      readStatus: string;
    }>
  ): Promise<RecommendationResponse> {
    // Check ownership
    const isOwner = await RecommendationModelOps.isOwner(recommendationId, userId);
    if (!isOwner) {
      throw new Error('You can only update your own recommendations');
    }

    const result = await RecommendationModelOps.update(recommendationId, data);
    if (!result) {
      throw new Error('Recommendation not found');
    }
    return result;
  },

  async deleteRecommendation(recommendationId: string, userId: string): Promise<void> {
    // Check ownership
    const isOwner = await RecommendationModelOps.isOwner(recommendationId, userId);
    if (!isOwner) {
      throw new Error('You can only delete your own recommendations');
    }

    await RecommendationModelOps.delete(recommendationId);
  },

  async getUserRecommendations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    return RecommendationModelOps.findByUserId(userId, page, limit);
  },

  async getUserFavorites(userId: string) {
    return RecommendationModelOps.getFavorites(userId);
  },

  async getByReadStatus(userId: string, status: string) {
    return RecommendationModelOps.getByReadStatus(userId, status);
  },

  async createManualBook(
    data: CreateBookInput,
    _userId: string
  ): Promise<BookResponse> {
    // Check if book with same ISBN already exists
    if (data.isbn) {
      const existing = await BookModelOps.findByIsbn(data.isbn);
      if (existing) {
        throw new Error('A book with this ISBN already exists');
      }
    }

    const book = await BookModelOps.create({
      ...data,
      source: 'manual' as const,
    });

    return book;
  },

  async searchLocalDatabase(
    query: string,
    page: number = 1,
    limit: number = 20
  ) {
    return BookModelOps.search(query, page, limit);
  },
};

export default BookService;
