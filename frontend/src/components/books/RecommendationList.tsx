'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Loader2, BookOpen, Star, Heart, Trash2, MoreVertical, 
  Eye, EyeOff, Clock, CheckCircle, BookMarked, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookApi, type Recommendation } from '@/lib/books/bookApi';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

// User Recommendation Card Component
interface UserRecCardProps {
  recommendation: Recommendation;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

function UserRecCard({
  recommendation,
  onDelete,
  onToggleFavorite,
}: UserRecCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const book = recommendation.book;
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this book from your list?')) {
      return;
    }

    setIsDeleting(true);
    await onDelete(recommendation.id);
    setIsDeleting(false);
  };

  const handleToggleFavorite = async () => {
    setIsToggling(true);
    await onToggleFavorite(recommendation.id, !recommendation.isFavorite);
    setIsToggling(false);
    
    toast({
      title: recommendation.isFavorite ? 'Removed from favorites' : 'Added to favorites',
      description: recommendation.isFavorite 
        ? 'Book removed from your favorites list'
        : 'Book added to your favorites list',
    });
  };

  const statusConfig = {
    read: {
      label: 'Read',
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    reading: {
      label: 'Reading',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    want_to_read: {
      label: 'Want to Read',
      icon: BookMarked,
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
  };

  const currentStatus = statusConfig[recommendation.readStatus as keyof typeof statusConfig] || statusConfig.read;
  const StatusIcon = currentStatus.icon;

  return (
    <Card className="overflow-hidden group card-hover bg-card/50 backdrop-blur-sm border-transparent shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* Book Cover */}
        <Link href={`/books/${recommendation.bookId}`} className="shrink-0 block">
          <div className="relative w-full sm:w-36 h-48 sm:h-auto aspect-[2/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {book?.coverImage ? (
              <img
                src={book.coverImage}
                alt={book?.title || 'Book'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Favorite Heart Overlay */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleToggleFavorite();
              }}
              disabled={isToggling}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
                recommendation.isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${recommendation.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </Link>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/books/${recommendation.bookId}`} className="hover:underline">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {book?.title || 'Unknown Book'}
                  </CardTitle>
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{book?.author || 'Unknown Author'}</p>
              </div>
              
              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Heart className={`h-4 w-4 mr-2 ${recommendation.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {recommendation.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from Library
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 pb-2 space-y-3">
            {/* Rating & Status Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 transition-all ${
                      star <= recommendation.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium">{recommendation.rating}</span>
              </div>

              {/* Status Badge */}
              <Badge variant="outline" className={`text-xs font-medium border ${currentStatus.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {currentStatus.label}
              </Badge>

              {/* Visibility */}
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                {recommendation.isPublic ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>

            {/* Review */}
            {recommendation.review && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground line-clamp-3 italic">
                  &ldquo;{recommendation.review}&rdquo;
                </p>
              </div>
            )}

            {/* Date & Social Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Added {new Date(recommendation.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {recommendation.likesCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Edit3 className="h-3.5 w-3.5" />
                  {recommendation.commentsCount || 0}
                </span>
              </div>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="pt-2 border-t">
            <div className="flex items-center gap-2 w-full">
              <Link href={`/books/${recommendation.bookId}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full rounded-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

// Empty State Component
function EmptyState({ type }: { type: string }) {
  const messages = {
    all: {
      title: 'Your library is empty',
      description: 'Start building your collection by searching for books and adding them to your list.',
      action: 'Search Books',
    },
    read: {
      title: 'No finished books yet',
      description: 'Books you mark as read will appear here. Keep reading!',
      action: null,
    },
    reading: {
      title: 'Not reading anything right now',
      description: 'Books you\'re currently reading will appear here.',
      action: null,
    },
    want_to_read: {
      title: 'Your reading list is empty',
      description: 'Add books you want to read later to build your reading list.',
      action: null,
    },
    favorites: {
      title: 'No favorites yet',
      description: 'Heart a book to add it to your favorites collection.',
      action: null,
    },
  };

  const message = messages[type as keyof typeof messages] || messages.all;

  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
        <BookMarked className="h-12 w-12 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{message.title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-4">
        {message.description}
      </p>
      {message.action && (
        <Button variant="outline" className="rounded-full">
          {message.action}
        </Button>
      )}
    </div>
  );
}

// Recommendation List Component
export function RecommendationList() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const fetchRecommendations = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await bookApi.getMyRecommendations(1, 50);

      if (response.success && response.data) {
        setRecommendations(response.data.items);
      } else {
        setError(response.error || response.message || 'Failed to load recommendations');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleDelete = async (id: string) => {
    const response = await bookApi.deleteRecommendation(id);
    if (response.success) {
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const response = await bookApi.updateRecommendation(id, { isFavorite });
    if (response.success && response.data) {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isFavorite } : r))
      );
    }
  };

  const filteredRecommendations = recommendations.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'favorites') return r.isFavorite;
    return r.readStatus === activeTab;
  });

  const stats = {
    total: recommendations.length,
    read: recommendations.filter(r => r.readStatus === 'read').length,
    reading: recommendations.filter(r => r.readStatus === 'reading').length,
    wantToRead: recommendations.filter(r => r.readStatus === 'want_to_read').length,
    favorites: recommendations.filter(r => r.isFavorite).length,
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
          <BookOpen className="h-12 w-12 text-primary/60" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Sign in to view your books</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Create an account or sign in to start building your personal book collection.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="animate-fade-in">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-transparent shadow-sm text-center">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-transparent shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.read}</div>
          <div className="text-sm text-muted-foreground">Read</div>
        </div>
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-transparent shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.reading}</div>
          <div className="text-sm text-muted-foreground">Reading</div>
        </div>
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-transparent shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.wantToRead}</div>
          <div className="text-sm text-muted-foreground">To Read</div>
        </div>
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-transparent shadow-sm text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.favorites}</div>
          <div className="text-sm text-muted-foreground">Favorites</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            All
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="read" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <span className="hidden sm:inline">Read</span>
            <CheckCircle className="h-4 w-4 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="reading" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <span className="hidden sm:inline">Reading</span>
            <BookOpen className="h-4 w-4 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="want_to_read" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <span className="hidden sm:inline">To Read</span>
            <BookMarked className="h-4 w-4 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="favorites" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <Heart className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {['all', 'read', 'reading', 'want_to_read', 'favorites'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6 animate-fade-in">
            {filteredRecommendations.length === 0 ? (
              <EmptyState type={tab} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 stagger-animation">
                {filteredRecommendations.map((rec) => (
                  <UserRecCard
                    key={rec.id}
                    recommendation={rec}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default RecommendationList;
