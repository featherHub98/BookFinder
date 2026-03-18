'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bookmark, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { bookApi, type Recommendation } from '@/lib/books/bookApi';
import { RecommendationCard } from '@/components/social/RecommendationCard';

export default function SavedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [favorites, setFavorites] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/?action=login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated, router]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const result = await bookApi.getFavorites();
      if (result.success && result.data) {
        setFavorites(result.data);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Bookmark className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Saved Posts</h1>
          <p className="text-muted-foreground">Your bookmarked book recommendations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Saved Posts Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              When you save book recommendations, they&apos;ll appear here for easy access later.
            </p>
            <Button onClick={() => router.push('/')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Books
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {favorites.map((rec) => (
            <RecommendationCard key={rec._id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
