import { Request, Response } from 'express';
import BookService from '../services/Book.service';
import {
  validateInput,
  bookSearchSchema,
  createRecommendationSchema,
  updateRecommendationSchema,
  createManualBookSchema,
} from '../utils/validation';
import type { AuthenticatedRequest, ApiResponse } from '../types';

// Book Controller - HTTP Request Handlers
export const BookController = {
  async search(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateInput(bookSearchSchema, {
        q: req.query.q,
        limit: req.query.limit,
        page: req.query.page,
        field: req.query.field,
      });

      if (!validation.success || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: validation.error,
        } as ApiResponse);
        return;
      }

      const result = await BookService.searchOpenLibrary(
        validation.data.q,
        validation.data.limit,
        validation.data.page,
        validation.data.field
      );

      res.status(200).json({
        success: true,
        message: 'Books found',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getBook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const book = await BookService.getBookById(id);

      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Book not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Book retrieved',
        data: book,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get book';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getBookDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await BookService.getBookWithDetails(id, userId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Book not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Book details retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get book details';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getPublicFeed(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await BookService.getPublicRecommendations(page, limit);

      res.status(200).json({
        success: true,
        message: 'Feed retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get feed';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async createManualBook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const validation = validateInput(createManualBookSchema, req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: validation.error,
        } as ApiResponse);
        return;
      }

      const book = await BookService.createManualBook(validation.data, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: book,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create book';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },
};

export default BookController;
