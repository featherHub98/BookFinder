import { z } from 'zod';

// Book Search Validation Schema
export const bookSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  limit: z.coerce.number().min(1).max(50).default(10),
  page: z.coerce.number().min(1).default(1),
  field: z.enum(['title', 'author', 'isbn', 'subject']).optional(),
});

export type BookSearchInput = z.infer<typeof bookSearchSchema>;

// Create Recommendation Validation Schema
export const createRecommendationSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  review: z.string().max(2000, 'Review must be less than 2000 characters').optional(),
  isPublic: z.boolean().default(true),
  readStatus: z.enum(['read', 'reading', 'want_to_read']).default('read'),
});

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>;

// Update Recommendation Validation Schema
export const updateRecommendationSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  review: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  readStatus: z.enum(['read', 'reading', 'want_to_read']).optional(),
});

export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>;

// Create Manual Book Validation Schema
export const createManualBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  author: z.string().min(1, 'Author is required').max(200, 'Author name too long'),
  isbn: z.string().max(20).optional(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  publisher: z.string().max(200).optional(),
  publishYear: z.coerce.number().min(1000).max(new Date().getFullYear() + 1).optional(),
  pageCount: z.coerce.number().min(1).optional(),
  genres: z.array(z.string().max(100)).max(10).optional(),
});

export type CreateManualBookInput = z.infer<typeof createManualBookSchema>;

// Validation Helper Function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}
