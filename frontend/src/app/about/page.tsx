import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, Heart, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about BookWorm',
};

export default function AboutPage() {
  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">About BookWorm</CardTitle>
          <p className="text-muted-foreground mt-2">Your Personal Book Recommendation Service</p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground">
              BookWorm is a community-driven platform designed to help book lovers discover their next great read. 
              We believe that the best recommendations come from fellow readers who share your taste and passion for literature.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Our algorithm learns from your reading preferences to suggest books you&apos;ll love.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Community Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with fellow readers, follow their reviews, and share your own discoveries.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Track Your Journey</h3>
                <p className="text-sm text-muted-foreground">
                  Keep track of books you&apos;ve read, want to read, and love. Build your personal library.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Our Mission</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              We&apos;re on a mission to make book discovery personal again. In a world of algorithmic suggestions, 
              we believe the most meaningful recommendations come from real readers with real experiences.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">What You Can Do</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <BookOpen className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h4 className="font-medium">Search & Discover</h4>
                  <p className="text-sm text-muted-foreground">
                    Search through millions of books and discover new titles based on your interests.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Heart className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h4 className="font-medium">Rate & Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your thoughts on books you&apos;ve read and help others discover great reads.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h4 className="font-medium">Follow & Connect</h4>
                  <p className="text-sm text-muted-foreground">
                    Follow readers with similar tastes and see what they&apos;re reading and recommending.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h4 className="font-medium">Get Personalized Picks</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive personalized book recommendations based on your reading history.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-6">
            <p className="text-muted-foreground">
              Have questions or feedback? We&apos;d love to hear from you at{' '}
              <a href="mailto:hello@bookworm.app" className="text-primary hover:underline">
                hello@bookworm.app
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
