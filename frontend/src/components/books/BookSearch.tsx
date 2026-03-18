'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, BookOpen, Star, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { bookApi, type Book } from '@/lib/books/bookApi';
import { AddRecommendationDialog } from './AddRecommendationDialog';

// Book Card Component
interface BookCardProps {
  book: Book;
  onAddRecommendation: (book: Book) => void;
  onViewDetails: (book: Book) => void;
}

function BookCard({ book, onAddRecommendation, onViewDetails }: BookCardProps) {
  const handleCardClick = () => {
    onViewDetails(book);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddRecommendation(book);
  };

  return (
    <Card 
      className="group overflow-hidden flex flex-col h-full cursor-pointer bg-card/50 backdrop-blur-sm border-transparent shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* Book Cover with Gradient Overlay */}
      <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
          </div>
        )}
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Add Button - Shows on Hover */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <Button 
            size="sm" 
            className="w-full btn-primary-gradient shadow-lg"
            onClick={handleButtonClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Library
          </Button>
        </div>
        
        {/* Rating Badge */}
        {book.averageRating > 0 && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold">{book.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      {/* Book Info */}
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {book.publishYear && (
            <Badge variant="secondary" className="text-xs font-normal">
              {book.publishYear}
            </Badge>
          )}
          {book.pageCount && (
            <Badge variant="outline" className="text-xs font-normal">
              {book.pageCount} pages
            </Badge>
          )}
        </div>
        {book.genres && book.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.genres.slice(0, 2).map((genre, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-0 h-5 bg-primary/5 border-primary/20 text-primary/80"
              >
                {genre}
              </Badge>
            ))}
            {book.genres.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                +{book.genres.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Footer with Add Button - Visible on Mobile */}
      <CardFooter className="p-4 pt-0 sm:hidden">
        <Button 
          className="w-full" 
          size="sm"
          onClick={handleButtonClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Library
        </Button>
      </CardFooter>
    </Card>
  );
}

// Book Search Component
export function BookSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const searchBooks = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await bookApi.search(searchQuery, pageNum, 12);

      if (response.success && response.data) {
        if (pageNum === 1) {
          setBooks(response.data.items);
        } else {
          setBooks(prev => [...prev, ...response.data!.items]);
        }
        setHasMore(response.data.hasMore);
        setTotal(response.data.total);
        setPage(pageNum);
      } else {
        setError(response.error || response.message || 'Search failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    searchBooks(query, 1);
  };

  const loadMore = () => {
    searchBooks(query, page + 1);
  };

  const handleAddRecommendation = (book: Book) => {
    setSelectedBook(book);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (book: Book) => {
    router.push(`/books/${book._id}`);
  };

  // Popular searches for quick access
  const popularSearches = ['Fantasy', 'Mystery', 'Romance', 'Science Fiction', 'Biography'];

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-card/50 backdrop-blur-sm border-transparent shadow-sm focus:shadow-md transition-shadow"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-6 btn-primary-gradient" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </form>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Popular:</span>
          {popularSearches.map((term) => (
            <Button
              key={term}
              variant="outline"
              size="sm"
              className="rounded-full text-xs bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
              onClick={() => {
                setQuery(term);
                searchBooks(term, 1);
              }}
            >
              {term}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Header */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-semibold text-foreground">{total.toLocaleString()}</span> books
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Results powered by Open Library
          </div>
        </div>
      )}

      {/* Book Grid */}
      {books.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 stagger-animation">
          {books.map((book, index) => (
            <BookCard
              key={book._id || index}
              book={book}
              onAddRecommendation={handleAddRecommendation}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={isLoading}
            className="min-w-[200px] rounded-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-5 w-5" />
                Load More Books
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && books.length === 0 && query && !error && (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No books found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We couldn&apos;t find any books matching &ldquo;{query}&rdquo;. Try a different search term or browse our popular categories.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setQuery('')}
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && books.length === 0 && !query && (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
            <Search className="h-12 w-12 text-primary/60" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Search for books</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter a book title, author name, or ISBN to find your next great read from millions of books.
          </p>
        </div>
      )}

      {/* Add Recommendation Dialog */}
      {selectedBook && (
        <AddRecommendationDialog
          book={selectedBook}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
}

export default BookSearch;
