import type { Request, Response } from 'express';
import BookService from '../services/Book.service';
import {
  validateInput,
  createRecommendationSchema,
  updateRecommendationSchema,
} from '../utils/validation';
import type { AuthenticatedRequest, ApiResponse } from '../types';

// Recommendation Controller - HTTP Request Handlers
export const RecommendationController = {
  async add(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const validation = validateInput(createRecommendationSchema, req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: validation.error,
        } as ApiResponse);
        return;
      }

      const recommendation = await BookService.addRecommendation(
        req.user.id,
        validation.data
      );

      res.status(201).json({
        success: true,
        message: 'Recommendation added successfully',
        data: recommendation,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add recommendation';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { id } = req.params;

      const validation = validateInput(updateRecommendationSchema, req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: validation.error,
        } as ApiResponse);
        return;
      }

      const recommendation = await BookService.updateRecommendation(
        id,
        req.user.id,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Recommendation updated successfully',
        data: recommendation,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update recommendation';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { id } = req.params;

      await BookService.deleteRecommendation(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Recommendation deleted successfully',
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete recommendation';
      res.status(400).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getMy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await BookService.getUserRecommendations(req.user.id, page, limit);

      res.status(200).json({
        success: true,
        message: 'Recommendations retrieved',
        data: result,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get recommendations';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const favorites = await BookService.getUserFavorites(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Favorites retrieved',
        data: favorites,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get favorites';
      res.status(500).json({
        success: false,
        message,
      } as ApiResponse);
    }
  },

  async getByStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { status } = req.params;
      const validStatuses = ['read', 'reading', 'want_to_read'];

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        } as ApiResponse);
        return;
      }

      const recommendations = await BookService.getByReadStatus(req.user.id, status);

      res.status(200).json({
        success: true,
        message: 'Recommendations retrieved',
        data: recommendations,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get recommendations';
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
};

export default RecommendationController;
