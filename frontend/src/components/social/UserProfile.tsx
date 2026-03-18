'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, BookOpen, Users, Heart, MessageCircle, Settings,
  Calendar, Edit, UserPlus, UserCheck, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { bookApi, type Recommendation, type UserProfile as UserProfileType } from '@/lib/books/bookApi';
import { authApi, type PublicUserProfile } from '@/lib/auth/authApi';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { RecommendationCard } from './RecommendationCard';

export function UserProfile() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [followers, setFollowers] = useState<UserProfileType[]>([]);
  const [following, setFollowing] = useState<UserProfileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('books');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { toast } = useToast();

  const isOwnProfile = currentUserId === userId;

  const loadUserData = useCallback(async () => {
    // Guard against undefined userId
    if (!userId || userId === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load user profile data
      const userResult = await authApi.getUserById(userId);
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
      }

      // Load user's recommendations
      const recsResult = await bookApi.getPublicFeed(1, 20);
      if (recsResult.success && recsResult.data) {
        // Filter to only this user's recommendations
        const userRecs = recsResult.data.items.filter(
          (rec) => rec.userId === userId
        );
        setRecommendations(userRecs);
      }

      // Load followers/following
      const [followersResult, followingResult] = await Promise.all([
        bookApi.getFollowers(userId, 1, 20),
        bookApi.getFollowing(userId, 1, 20),
      ]);

      if (followersResult.success && followersResult.data) {
        setFollowers(followersResult.data.items || []);
      }

      if (followingResult.success && followingResult.data) {
        setFollowing(followingResult.data.items || []);
      }

      // Check if current user follows this user
      if (isAuthenticated && !isOwnProfile) {
        const currentUserFollowing = followingResult.data?.items || [];
        const followsMe = currentUserFollowing.some(
          (u) => u._id === currentUserId
        );
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUserId, isAuthenticated, isOwnProfile]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated || isTogglingFollow) return;

    setIsTogglingFollow(true);
    try {
      const result = await bookApi.toggleFollow(userId);
      if (result.success && result.data) {
        setIsFollowing(result.data.followed);
        toast({
          title: result.data.followed ? 'Following' : 'Unfollowed',
          description: result.data.followed 
            ? `You are now following this user` 
            : `You have unfollowed this user`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to follow/unfollow user',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="text-2xl">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{user?.name || 'Anonymous User'}</h1>
                {user?.bio && (
                  <Badge variant="secondary">{user.bio}</Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{recommendations.length}</span>
                  <span className="text-muted-foreground">books</span>
                </div>
                <Link href={`/profile/${userId}/followers`} className="flex items-center gap-1 hover:underline">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user?.followersCount || followers.length}</span>
                  <span className="text-muted-foreground">followers</span>
                </Link>
                <Link href={`/profile/${userId}/following`} className="flex items-center gap-1 hover:underline">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user?.followingCount || following.length}</span>
                  <span className="text-muted-foreground">following</span>
                </Link>
              </div>

              {/* Bio */}
              {user?.bio && (
                <p className="text-muted-foreground">{user.bio}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Link href="/settings">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : isAuthenticated && (
                  <Button
                    onClick={handleToggleFollow}
                    disabled={isTogglingFollow}
                    variant={isFollowing ? 'outline' : 'default'}
                  >
                    {isTogglingFollow ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isFollowing ? (
                      <UserCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="books" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Books ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Followers ({followers.length})
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Following ({following.length})
          </TabsTrigger>
        </TabsList>

        {/* Books Tab */}
        <TabsContent value="books" className="mt-4 space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No books yet</p>
                {isOwnProfile && (
                  <p className="text-sm">Start adding books to your collection!</p>
                )}
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec) => (
              <RecommendationCard key={rec._id} recommendation={rec} />
            ))
          )}
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {followers.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No followers yet</p>
                </CardContent>
              </Card>
            ) : (
              followers.map((follower) => (
                <UserCard key={follower._id} user={follower} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {following.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Not following anyone yet</p>
                </CardContent>
              </Card>
            ) : (
              following.map((followedUser) => (
                <UserCard key={followedUser._id} user={followedUser} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// User Card Component
function UserCard({ user }: { user: UserProfileType }) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    setIsToggling(true);

    try {
      const result = await bookApi.toggleFollow(user._id);
      if (result.success && result.data) {
        setIsFollowing(result.data.followed);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to follow/unfollow user',
        variant: 'destructive',
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Link href={`/profile/${user._id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name || 'Anonymous'}</p>
              <p className="text-sm text-muted-foreground">
                {user.recommendationsCount} books
              </p>
            </div>
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleFollow}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <UserCheck className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default UserProfile;
