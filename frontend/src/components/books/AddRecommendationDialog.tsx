'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bookApi } from '@/lib/books/bookApi';
import { useAuthStore } from '@/store/authStore';
import type { Book } from '@/lib/books/bookApi';

// Form Schema
const recommendationSchema = z.object({
  rating: z.coerce.number().min(1, 'Rating is required').max(5),
  review: z.string().max(2000, 'Review must be less than 2000 characters').optional(),
  readStatus: z.enum(['read', 'reading', 'want_to_read']),
  isPublic: z.boolean().default(true),
});

type RecommendationFormData = z.infer<typeof recommendationSchema>;

// Star Rating Component
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className="focus:outline-none"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              (hover || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Add Recommendation Dialog Component
interface AddRecommendationDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRecommendationDialog({
  book,
  open,
  onOpenChange,
}: AddRecommendationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      rating: 0,
      review: '',
      readStatus: 'read',
      isPublic: true,
    },
  });

  const rating = watch('rating');
  const readStatus = watch('readStatus');

  const onSubmit = async (data: RecommendationFormData) => {
    if (data.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await bookApi.addRecommendation({
        bookId: book._id,  // Use _id since backend returns _id, not id
        rating: data.rating,
        review: data.review,
        readStatus: data.readStatus,
        isPublic: data.isPublic,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          reset();
          setSuccess(false);
        }, 1500);
      } else {
        setError(response.error || response.message || 'Failed to add recommendation');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      reset();
      setError(null);
      setSuccess(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please login to add book recommendations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to Your List</DialogTitle>
          <DialogDescription>
            Share your thoughts about this book
          </DialogDescription>
        </DialogHeader>

        {/* Book Info */}
        <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold line-clamp-2">{book.title}</h4>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            {book.publishYear && (
              <p className="text-xs text-muted-foreground mt-1">{book.publishYear}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
              <AlertDescription className="text-green-700 dark:text-green-300">
                Book added to your list successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <StarRating
              value={rating}
              onChange={(value) => setValue('rating', value)}
              disabled={isLoading}
            />
            {errors.rating && (
              <p className="text-sm text-destructive">{errors.rating.message}</p>
            )}
            <input type="hidden" {...register('rating')} />
          </div>

          {/* Read Status */}
          <div className="space-y-2">
            <Label htmlFor="readStatus">Reading Status</Label>
            <Select
              value={readStatus}
              onValueChange={(value) => setValue('readStatus', value as 'read' | 'reading' | 'want_to_read')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="reading">Currently Reading</SelectItem>
                <SelectItem value="want_to_read">Want to Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review */}
          <div className="space-y-2">
            <Label htmlFor="review">Review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about this book..."
              rows={4}
              disabled={isLoading}
              {...register('review')}
            />
            {errors.review && (
              <p className="text-sm text-destructive">{errors.review.message}</p>
            )}
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              className="h-4 w-4"
              defaultChecked
              disabled={isLoading}
              {...register('isPublic')}
            />
            <Label htmlFor="isPublic" className="text-sm font-normal">
              Make this recommendation public
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to List'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddRecommendationDialog;
