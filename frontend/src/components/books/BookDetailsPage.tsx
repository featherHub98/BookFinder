'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Star,
  User,
  Calendar,
  Building2,
  FileText,
  ArrowLeft,
  Loader2,
  Heart,
  MessageSquare,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { bookApi, type BookDetails } from '@/lib/books/bookApi';
import { useAuthStore } from '@/store/authStore';
import { StarRating, RatingSummary } from './StarRating';

// Book Details Page Component
export function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating form state
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [readStatus, setReadStatus] = useState<'read' | 'reading' | 'want_to_read'>('read');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await bookApi.getBookDetails(bookId);

        if (response.success && response.data) {
          setBookDetails(response.data);
          
          // Set existing user rating if present
          if (response.data.userRating) {
            setRating(response.data.userRating.rating);
            setReview(response.data.userRating.review || '');
            setReadStatus(response.data.userRating.readStatus as 'read' | 'reading' | 'want_to_read');
            setIsPublic(response.data.userRating.isPublic);
          }
        } else {
          setError(response.error || response.message || 'Failed to load book');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  // Submit rating
  const handleSubmitRating = async () => {
    if (!isAuthenticated) {
      router.push('/?action=login');
      return;
    }

    if (rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await bookApi.addRecommendation({
        bookId,
        rating,
        review: review || undefined,
        isPublic,
        readStatus,
      });

      if (response.success && response.data) {
        setSubmitSuccess(true);
        // Refresh book details
        const detailsResponse = await bookApi.getBookDetails(bookId);
        if (detailsResponse.success && detailsResponse.data) {
          setBookDetails(detailsResponse.data);
        }
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        setSubmitError(response.error || response.message || 'Failed to submit rating');
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete rating
  const handleDeleteRating = async () => {
    if (!bookDetails?.userRating || !confirm('Are you sure you want to remove your rating?')) {
      return;
    }

    try {
      const response = await bookApi.deleteRecommendation(bookDetails.userRating._id);
      if (response.success) {
        setRating(0);
        setReview('');
        setReadStatus('read');
        setIsPublic(true);
        // Refresh book details
        const detailsResponse = await bookApi.getBookDetails(bookId);
        if (detailsResponse.success && detailsResponse.data) {
          setBookDetails(detailsResponse.data);
        }
      }
    } catch (err) {
      setSubmitError('Failed to delete rating');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !bookDetails) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Book not found'}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
      </div>
    );
  }

  const { book, userRating, publicReviews, stats } = bookDetails;

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Search
      </Button>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Book Cover & Quick Info */}
        <div className="space-y-4">
          {/* Cover Image */}
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-muted">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-20 w-20 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {stats.totalRatings > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rating Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <RatingSummary
                  averageRating={stats.averageRating}
                  totalRatings={stats.totalRatings}
                  distribution={stats.ratingDistribution}
                />
              </CardContent>
            </Card>
          )}

          {/* Book Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {book.publisher && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Publisher</p>
                    <p className="text-muted-foreground">{book.publisher}</p>
                  </div>
                </div>
              )}
              {book.publishYear && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Published</p>
                    <p className="text-muted-foreground">{book.publishYear}</p>
                  </div>
                </div>
              )}
              {book.pageCount && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Pages</p>
                    <p className="text-muted-foreground">{book.pageCount}</p>
                  </div>
                </div>
              )}
              {book.isbn && (
                <div>
                  <p className="font-medium">ISBN</p>
                  <p className="text-muted-foreground font-mono text-xs">{book.isbn}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title & Author */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-xl text-muted-foreground">by {book.author}</p>
          </div>

          {/* Genres */}
          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.genres.map((genre, index) => (
                <Badge key={index} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {book.description && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">{book.description}</p>
            </div>
          )}

          <Separator />

          {/* Rating Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {userRating ? 'Your Rating' : 'Rate This Book'}
              </CardTitle>
              <CardDescription>
                {userRating
                  ? 'Update your rating and review'
                  : isAuthenticated
                  ? 'Share your thoughts about this book'
                  : 'Login to rate this book'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {submitSuccess && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Rating saved successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Star Rating */}
              <div className="space-y-2">
                <Label>Your Rating *</Label>
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  showValue
                />
              </div>

              {/* Read Status */}
              <div className="space-y-2">
                <Label htmlFor="readStatus">Reading Status</Label>
                <Select
                  value={readStatus}
                  onValueChange={(value) => setReadStatus(value as typeof readStatus)}
                >
                  <SelectTrigger id="readStatus">
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
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {review.length}/2000
                </p>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isPublic" className="font-normal">
                  Make my review public
                </Label>
              </div>

              {/* Submit/Update Button */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitRating}
                  disabled={isSubmitting || !isAuthenticated || rating === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : userRating ? (
                    'Update Rating'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Rating
                    </>
                  )}
                </Button>

                {userRating && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRating}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Public Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews
              </CardTitle>
              <CardDescription>
                What readers are saying
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publicReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews yet. Be the first to review this book!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {publicReviews.map((review, index) => (
                    <div key={review._id || index} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${review.userId}`} className="shrink-0">
                          <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                            <AvatarImage src={review.user?.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {review.user?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/profile/${review.userId}`}
                              className="font-medium text-sm hover:text-primary transition-colors"
                            >
                              {review.user?.name || 'Anonymous User'}
                            </Link>
                            <StarRating value={review.rating} readonly size="sm" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.review && (
                        <p className="text-sm text-muted-foreground pl-11">
                          {review.review}
                        </p>
                      )}
                      {index < publicReviews.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BookDetailsPage;
