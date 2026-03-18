import { BookModel, type IBook } from '../shared/db';
import type { BookResponse, CreateBookInput } from '../types';

// Helper: Transform MongoDB document to response
function toResponse(book: IBook): BookResponse {
  return {
    _id: book._id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    openLibraryId: book.openLibraryId,
    description: book.description,
    coverImage: book.coverImage,
    publisher: book.publisher,
    publishYear: book.publishYear,
    pageCount: book.pageCount,
    genres: book.genres,
    averageRating: book.averageRating,
    ratingsCount: book.ratingsCount,
    source: book.source,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

// Book Model - Database Operations
export const BookModelOps = {
  async create(data: CreateBookInput): Promise<BookResponse> {
    // Only include isbn if it has a value
    const bookData: Record<string, unknown> = {
      title: data.title,
      author: data.author,
      description: data.description || null,
      coverImage: data.coverImage || null,
      publisher: data.publisher || null,
      publishYear: data.publishYear || null,
      pageCount: data.pageCount || null,
      genres: data.genres || [],
      source: data.openLibraryId ? 'open_library' : 'manual',
    };

    // Only add isbn if it exists
    if (data.isbn) {
      bookData.isbn = data.isbn;
    }

    // Only add openLibraryId if it exists
    if (data.openLibraryId) {
      bookData.openLibraryId = data.openLibraryId;
    }

    const book = await BookModel.create(bookData);
    return toResponse(book);
  },

  async findById(id: string): Promise<BookResponse | null> {
    const book = await BookModel.findById(id);
    return book ? toResponse(book) : null;
  },

  async findByIsbn(isbn: string): Promise<BookResponse | null> {
    const book = await BookModel.findOne({ isbn });
    return book ? toResponse(book) : null;
  },

  async findByOpenLibraryId(openLibraryId: string): Promise<BookResponse | null> {
    const book = await BookModel.findOne({ openLibraryId });
    return book ? toResponse(book) : null;
  },

  async findOrCreateFromOpenLibrary(data: CreateBookInput): Promise<BookResponse> {
    // First try to find by Open Library ID (most reliable)
    if (data.openLibraryId) {
      const existing = await this.findByOpenLibraryId(data.openLibraryId);
      if (existing) return existing;
    }

    // Then try to find by ISBN (if available)
    if (data.isbn) {
      const existing = await this.findByIsbn(data.isbn);
      if (existing) return existing;
    }

    // Create new book
    return this.create(data);
  },

  async update(id: string, data: Partial<CreateBookInput>): Promise<BookResponse | null> {
    const book = await BookModel.findByIdAndUpdate(id, data, { new: true });
    return book ? toResponse(book) : null;
  },

  async updateRating(id: string, newRating: number): Promise<void> {
    const book = await BookModel.findById(id);
    if (!book) return;

    const newCount = book.ratingsCount + 1;
    const newAverage = ((book.averageRating * book.ratingsCount) + newRating) / newCount;

    await BookModel.findByIdAndUpdate(id, {
      averageRating: Math.round(newAverage * 10) / 10,
      ratingsCount: newCount,
    });
  },

  async recalculateRating(id: string): Promise<void> {
    const { RecommendationModel } = await import('../shared/db');
    
    const stats = await RecommendationModel.aggregate([
      { $match: { bookId: id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await BookModel.findByIdAndUpdate(id, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        ratingsCount: stats[0].count,
      });
    } else {
      await BookModel.findByIdAndUpdate(id, {
        averageRating: 0,
        ratingsCount: 0,
      });
    }
  },

  async findAll(page: number = 1, limit: number = 20): Promise<{
    items: BookResponse[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      BookModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookModel.countDocuments(),
    ]);

    return {
      items: items.map(toResponse),
      total,
      hasMore: skip + items.length < total,
    };
  },

  async search(query: string, page: number = 1, limit: number = 20): Promise<{
    items: BookResponse[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const searchFilter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { genres: { $regex: query, $options: 'i' } },
      ],
    };

    const [items, total] = await Promise.all([
      BookModel.find(searchFilter)
        .sort({ averageRating: -1 })
        .skip(skip)
        .limit(limit),
      BookModel.countDocuments(searchFilter),
    ]);

    return {
      items: items.map(toResponse),
      total,
      hasMore: skip + items.length < total,
    };
  },

  async delete(id: string): Promise<void> {
    await BookModel.findByIdAndDelete(id);
  },

  async getRecent(limit: number = 10): Promise<BookResponse[]> {
    const books = await BookModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    return books.map(toResponse);
  },

  async getTopRated(limit: number = 10): Promise<BookResponse[]> {
    const books = await BookModel.find({ ratingsCount: { $gt: 0 } })
      .sort({ averageRating: -1, ratingsCount: -1 })
      .limit(limit);
    return books.map(toResponse);
  },
};

export default BookModelOps;
