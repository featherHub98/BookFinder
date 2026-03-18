'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { bookApi, type UserProfile } from '@/lib/books/bookApi';
import { authApi, type PublicUserProfile } from '@/lib/auth/authApi';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function FollowersPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!userId || userId === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const userResult = await authApi.getUserById(userId);
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
      }

      const followersResult = await bookApi.getFollowers(userId, 1, 50);
      if (followersResult.success && followersResult.data) {
        setFollowers(followersResult.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load followers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Link href={`/profile/${userId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>
              Followers
              {user && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({user.followersCount || followers.length})
                </span>
              )}
            </CardTitle>
          </div>
          {user && (
            <p className="text-sm text-muted-foreground">
              People following {user.name || 'this user'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {followers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No followers yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {followers.map((follower) => (
                <UserCard key={follower._id} user={follower} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserCard({ user }: { user: UserProfile }) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || isToggling) return;
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
                {user.recommendationsCount || 0} books
              </p>
            </div>
            {isAuthenticated && (
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
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
