'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Users, TrendingUp, Sparkles, BookOpen, Star } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { bookApi, type Recommendation, type RecommendedBook, type Book } from '@/lib/books/bookApi';
import { RecommendationCard } from './RecommendationCard';
import { useAuthStore } from '@/store/authStore';

interface ActivityFeedProps {
  className?: string;
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState('following');
  const [feedItems, setFeedItems] = useState<Recommendation[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<RecommendedBook[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<RecommendedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loadActivityFeed = useCallback(async (pageNum: number = 1) => {
    if (!isAuthenticated) {
      setFeedItems([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await bookApi.getActivityFeed(pageNum, 10);
      
      if (result.success && result.data) {
        const newItems = result.data.items || [];
        if (pageNum === 1) {
          setFeedItems(newItems);
        } else {
          setFeedItems((prev) => [...prev, ...newItems]);
        }
        setHasMore(result.data.hasMore || false);
      }
    } catch (error) {
      setFeedItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await bookApi.getPersonalizedRecommendations(12);
      
      if (result.success && result.data) {
        setRecommendedBooks(result.data.items || []);
      }
    } catch (error) {
      setRecommendedBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await bookApi.getTrendingBooks(12);
      
      if (result.success && result.data) {
        setTrendingBooks(result.data.items || []);
      }
    } catch (error) {
      setTrendingBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'following') {
      loadActivityFeed(1);
    } else if (activeTab === 'recommended') {
      loadRecommendations();
    } else if (activeTab === 'trending') {
      loadTrending();
    }
  }, [activeTab, loadActivityFeed, loadRecommendations, loadTrending]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadActivityFeed(nextPage);
  };

  const handleRefresh = () => {
    setPage(1);
    if (activeTab === 'following') {
      loadActivityFeed(1);
    } else if (activeTab === 'recommended') {
      loadRecommendations();
    } else if (activeTab === 'trending') {
      loadTrending();
    }
  };

  return (
    <Card className={`${className} bg-card/30 backdrop-blur-sm border-transparent shadow-sm overflow-hidden`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span>Your Feed</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="following" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5">
                <Users className="h-4 w-4" />
                <span>Following</span>
              </TabsTrigger>
              <TabsTrigger value="recommended" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5">
                <Sparkles className="h-4 w-4" />
                <span>For You</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5">
                <TrendingUp className="h-4 w-4" />
                <span>Trending</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="following" className="mt-0 p-6 space-y-4 animate-fade-in">
            {!isAuthenticated ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
                  <Users className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign in to see your feed</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Follow other readers to see their book recommendations and reviews in your personalized feed.
                </p>
                <Button variant="default" className="rounded-full" onClick={() => window.location.href = '/'}>
                  Sign In
                </Button>
              </div>
            ) : isLoading && feedItems.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-32 w-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
                  <Users className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Follow some readers to see their book recommendations and reviews in your feed.
                </p>
                <Button variant="outline" className="rounded-full" onClick={() => setActiveTab('trending')}>
                  Explore trending books
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 stagger-animation">
                  {feedItems.map((item) => (
                    <RecommendationCard
                      key={item._id}
                      recommendation={item}
                      showUser
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore} 
                      disabled={isLoading}
                      className="rounded-full min-w-[180px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="recommended" className="mt-0 p-6 animate-fade-in">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : recommendedBooks.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
                  <Sparkles className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Add some books to your library to get personalized recommendations.
                </p>
                <Button variant="outline" className="rounded-full" onClick={() => setActiveTab('trending')}>
                  Browse trending books
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-animation">
                {recommendedBooks.map((item, index) => (
                  <RecommendedBookCard key={item.book?._id || index} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-0 p-6 animate-fade-in">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : trendingBooks.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
                  <TrendingUp className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No trending books</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Check back later to see what books are trending in our community.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-animation">
                {trendingBooks.map((item, index) => (
                  <RecommendedBookCard key={item.book?._id || index} item={item} showRank rank={index + 1} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RecommendedBookCard({ 
  item, 
  showRank = false, 
  rank 
}: { 
  item: RecommendedBook;
  showRank?: boolean;
  rank?: number;
}) {
  const book = item.book as Book | undefined;

  if (!book) return null;

  return (
    <Link href={`/books/${book._id}`}>
      <Card className="group overflow-hidden card-hover bg-card/50 backdrop-blur-sm border-transparent shadow-sm h-full">
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {showRank && rank && rank <= 3 && (
            <div className={`absolute top-2 left-2 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
              rank === 1 ? 'bg-amber-400 text-amber-900' :
              rank === 2 ? 'bg-slate-300 text-slate-700' :
              'bg-amber-600 text-amber-100'
            }`}>
              {rank}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <CardContent className="p-3 space-y-1">
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
          
          {item.reasons.length > 0 && (
            <Badge variant="secondary" className="text-xs font-normal mt-1 bg-primary/5 text-primary hover:bg-primary/10 border-0">
              {item.reasons[0]}
            </Badge>
          )}
          
          {book.averageRating > 0 && (
            <div className="flex items-center gap-1 pt-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{book.averageRating.toFixed(1)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default ActivityFeed;
