'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Share2, Bookmark, Star, ExternalLink,
  MoreHorizontal, Send, BookmarkCheck
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookApi, type Recommendation } from '@/lib/books/bookApi';
import { useToast } from '@/hooks/use-toast';

interface RecommendationCardProps {
  recommendation: Recommendation & {
    user?: {
      _id: string;
      name: string | null;
      avatar: string | null;
    };
    book?: {
      _id: string;
      title: string;
      author: string;
      coverImage: string | null;
    };
  };
  showUser?: boolean;
  onLikeChange?: (recommendationId: string, liked: boolean, likesCount: number) => void;
}

export function RecommendationCard({ 
  recommendation, 
  showUser: showUserProp = false, 
  onLikeChange 
}: RecommendationCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(recommendation.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();
  
  const showUser = showUserProp;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const result = await bookApi.toggleLike(recommendation._id);
      if (result.success && result.data) {
        setIsLiked(result.data.liked);
        setLikesCount(result.data.likesCount);
        onLikeChange?.(recommendation._id, result.data.liked, result.data.likesCount);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like recommendation',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy_link') => {
    const bookTitle = recommendation.book?.title || 'this book';
    const shareUrl = `${window.location.origin}/books/${recommendation.bookId}`;

    if (platform === 'copy_link') {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard',
      });
    } else {
      const shareText = `Check out ${bookTitle} on BookWorm!`;
      let url = '';
      
      switch (platform) {
        case 'twitter':
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case 'facebook':
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case 'linkedin':
          url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
          break;
      }
      
      window.open(url, '_blank', 'width=600,height=400');
    }

    // Record the share
    await bookApi.shareRecommendation(recommendation._id, platform);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);

    try {
      const result = await bookApi.addComment(recommendation._id, commentText.trim());
      if (result.success) {
        setCommentText('');
        toast({
          title: 'Comment added',
          description: 'Your comment has been posted',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getStatusStyle = () => {
    switch (recommendation.readStatus) {
      case 'read':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'reading':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'want_to_read':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (recommendation.readStatus) {
      case 'read': return '✓';
      case 'reading': return '📖';
      case 'want_to_read': return '📋';
      default: return '';
    }
  };

  return (
    <Card className="overflow-hidden card-hover border-transparent shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5">
        {/* User Info */}
        {showUser && recommendation.user && (
          <div className="flex items-center justify-between mb-4">
            <Link href={`/profile/${recommendation.userId}`} className="flex items-center gap-3 group">
              <Avatar className="h-11 w-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarImage src={recommendation.user.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                  {recommendation.user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold group-hover:text-primary transition-colors">
                  {recommendation.user.name || 'Anonymous'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {formatDate(recommendation.createdAt)}
                </p>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsSaved(!isSaved)}>
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save post
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy_link')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Book Info */}
        <div className="flex gap-4">
          {/* Book Cover */}
          <Link href={`/books/${recommendation.bookId}`} className="shrink-0 group">
            {recommendation.book?.coverImage ? (
              <div className="relative overflow-hidden rounded-lg shadow-md">
                <img
                  src={recommendation.book.coverImage}
                  alt={recommendation.book.title}
                  className="w-20 h-28 sm:w-24 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/5 transition-colors">
                <Bookmark className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            )}
          </Link>

          {/* Book Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <Link href={`/books/${recommendation.bookId}`} className="group">
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {recommendation.book?.title || 'Unknown Book'}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">{recommendation.book?.author}</p>
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 transition-colors ${
                    star <= recommendation.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
              <span className="text-sm font-medium ml-1">{recommendation.rating}/5</span>
            </div>

            {/* Review Text */}
            {recommendation.review && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {recommendation.review}
              </p>
            )}

            {/* Read Status Badge */}
            <Badge 
              variant="outline" 
              className={`text-xs font-medium border ${getStatusStyle()}`}
            >
              <span className="mr-1">{getStatusIcon()}</span>
              {recommendation.readStatus === 'read' && 'Read'}
              {recommendation.readStatus === 'reading' && 'Currently Reading'}
              {recommendation.readStatus === 'want_to_read' && 'Want to Read'}
            </Badge>
          </div>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="px-5 py-3 border-t bg-muted/30 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 rounded-full px-4 transition-all ${
            isLiked 
              ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50' 
              : 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50'
          }`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={`h-4 w-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
          <span className="font-medium">{likesCount || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 rounded-full px-4 transition-all hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 ${
            showComments ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/50' : ''
          }`}
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className={`h-4 w-4 ${showComments ? 'fill-current' : ''}`} />
          <span className="font-medium">{recommendation.commentsCount || 0}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full px-4 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/50"
            >
              <Share2 className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">{recommendation.sharesCount || 0}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleShare('copy_link')}>
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('twitter')}>
              Share to X
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('facebook')}>
              Share to Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('linkedin')}>
              Share to LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto">
          <Link href={`/books/${recommendation.bookId}`}>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardFooter>

      {/* Comment Section */}
      {showComments && (
        <div className="p-4 border-t bg-muted/20 animate-fade-in">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[44px] h-11 resize-none bg-background"
              />
              <Button 
                size="icon" 
                onClick={handleSubmitComment} 
                disabled={!commentText.trim() || isSubmittingComment}
                className="shrink-0 rounded-full h-11 w-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default RecommendationCard;
