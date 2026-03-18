'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Book, BookOpen, Star, Users, Search, Library, Sparkles, Rss, 
  ArrowRight, Quote, TrendingUp, Heart, MessageCircle, PenLine
} from 'lucide-react';
import { RegisterForm, LoginForm, UserMenu } from '@/components/auth';
import { BookSearch, RecommendationList } from '@/components/books';
import { ActivityFeed } from '@/components/social';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Determine which form to show
  const showLoginForm = action === 'login' && !isAuthenticated;
  const showRegisterForm = action === 'register' && !isAuthenticated;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-primary/3 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/4 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:bg-primary/30 transition-colors" />
              <Book className="relative h-7 w-7 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Book<span className="text-primary">Worm</span>
            </span>
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Auth Forms */}
        {(showLoginForm || showRegisterForm) && (
          <div className="flex justify-center py-12 px-4 animate-fade-in">
            {showLoginForm && <LoginForm />}
            {showRegisterForm && <RegisterForm />}
          </div>
        )}

        {/* Main App Content */}
        {!showLoginForm && !showRegisterForm && (
          <>
            {/* Hero Section (for non-authenticated users) */}
            {!isAuthenticated && (
              <section className={`relative py-20 md:py-28 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <div className="container px-4 max-w-6xl mx-auto">
                  <div className="text-center space-y-8">
                    {/* Animated Icon */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <BookOpen className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Main Heading */}
                    <div className="space-y-4">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                        Discover Your Next
                        <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                          Favorite Book
                        </span>
                      </h1>
                      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        BookWorm helps you find personalized book recommendations, track your reading journey, 
                        and connect with a community of passionate readers.
                      </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                      <Button 
                        size="lg" 
                        className="btn-primary-gradient text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all group"
                        onClick={() => window.location.href = '/?action=register'}
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent/50 transition-colors"
                        onClick={() => window.location.href = '/?action=login'}
                      >
                        Sign In
                      </Button>
                    </div>

                    {/* Social Proof */}
                    <div className="flex items-center justify-center gap-8 pt-8 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="text-sm">10,000+ readers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="text-sm">3M+ books</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        <span className="text-sm">50,000+ reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Features Section (for non-authenticated users) */}
            {!isAuthenticated && (
              <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Everything you need for your reading journey
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      From discovering new books to sharing your thoughts with the community
                    </p>
                  </div>

                  {/* Feature Cards Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-animation">
                    {/* Feature 1 */}
                    <div className="group relative overflow-hidden rounded-2xl bg-card border p-6 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Sparkles className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Our AI learns your preferences and suggests books you&apos;ll love based on your reading history and interests.
                        </p>
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="group relative overflow-hidden rounded-2xl bg-card border p-6 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Library className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Track Your Reading</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Keep track of books you&apos;ve read, want to read, and currently reading. Set goals and monitor your progress.
                        </p>
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="group relative overflow-hidden rounded-2xl bg-card border p-6 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Users className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Community Reviews</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Read and share reviews with a community of passionate book lovers. Discover what others are reading.
                        </p>
                      </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="group relative overflow-hidden rounded-2xl bg-card border p-6 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Rss className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Activity Feed</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Follow your friends and see what they&apos;re reading. Get inspired by their recommendations and reviews.
                        </p>
                      </div>
                    </div>

                    {/* Feature 5 */}
                    <div className="group relative overflow-hidden rounded-2xl bg-card border p-6 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <TrendingUp className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Trending Books</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Stay updated with what&apos;s popular. Discover trending books based on community engagement.
                        </p>
                      </div>
                    </div>

                    {/* Feature 6 */}
                    <div className="group relative overflow-hidden rounded-2xl bg-card border p-6 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Heart className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Social Interaction</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Like, comment, and share recommendations. Build connections with fellow book enthusiasts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Quote Section */}
            {!isAuthenticated && (
              <section className="py-16 bg-card border-y">
                <div className="container px-4 max-w-4xl mx-auto text-center">
                  <Quote className="h-12 w-12 text-primary/30 mx-auto mb-6" />
                  <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed mb-6">
                    &ldquo;A reader lives a thousand lives before he dies. 
                    The man who never reads lives only one.&rdquo;
                  </blockquote>
                  <cite className="text-muted-foreground">— George R.R. Martin</cite>
                </div>
              </section>
            )}

            {/* Authenticated User Dashboard */}
            {isAuthenticated && (
              <section className="py-6 px-4">
                <div className="max-w-6xl mx-auto">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex justify-center">
                      <TabsList className="grid grid-cols-4 w-full max-w-lg bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger 
                          value="feed" 
                          className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          <Rss className="h-4 w-4" />
                          <span className="hidden sm:inline">Feed</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="search"
                          className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          <Search className="h-4 w-4" />
                          <span className="hidden sm:inline">Search</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="my-books"
                          className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          <Library className="h-4 w-4" />
                          <span className="hidden sm:inline">My Books</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="discover"
                          className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Discover</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Activity Feed Tab */}
                    <TabsContent value="feed" className="space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold">Your Activity Feed</h2>
                          <p className="text-muted-foreground mt-1">
                            See what your friends and followed users are reading.
                          </p>
                        </div>
                      </div>
                      <ActivityFeed />
                    </TabsContent>

                    {/* Search Books Tab */}
                    <TabsContent value="search" className="space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold">Find Your Next Read</h2>
                          <p className="text-muted-foreground mt-1">
                            Search millions of books and add them to your reading list.
                          </p>
                        </div>
                      </div>
                      <BookSearch />
                    </TabsContent>

                    {/* My Books Tab */}
                    <TabsContent value="my-books" className="space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold">Your Book Collection</h2>
                          <p className="text-muted-foreground mt-1">
                            Manage your reading list and recommendations.
                          </p>
                        </div>
                      </div>
                      <RecommendationList />
                    </TabsContent>

                    {/* Discover Tab */}
                    <TabsContent value="discover" className="space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold">Discover New Books</h2>
                          <p className="text-muted-foreground mt-1">
                            Personalized recommendations based on your reading preferences.
                          </p>
                        </div>
                      </div>
                      <ActivityFeed />
                    </TabsContent>
                  </Tabs>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-auto">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <span className="font-semibold">BookWorm</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 BookWorm. Your personal book recommendation service.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link href="/about" className="text-sm hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-sm hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
