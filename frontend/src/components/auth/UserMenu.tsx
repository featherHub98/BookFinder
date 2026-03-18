'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, Settings, BookOpen, Bookmark, Bell, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/auth/authApi';

// User Menu Component (with Logout)
export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Call logout endpoint (optional, for server-side cleanup)
      await authApi.logout();
    } catch {
      // Ignore errors, proceed with client logout
    } finally {
      // Clear auth state
      logout();
      router.push('/');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/?action=login')}
          className="rounded-full px-5 hidden sm:flex"
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={() => router.push('/?action=register')}
          className="rounded-full px-5 btn-primary-gradient"
        >
          Sign Up
        </Button>
      </div>
    );
  }

  // Use _id or id for profile link
  const userId = user._id || user.id;

  // Get initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 pl-1 pr-3 rounded-full hover:bg-muted/50 transition-colors group"
        >
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarImage src={user.avatar || undefined} alt={user.name || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block ml-2 text-sm font-medium">
            {user.name?.split(' ')[0] || 'User'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 p-2" 
        align="end" 
        forceMount
        sideOffset={8}
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={user.avatar || undefined} alt={user.name || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs py-0 h-5">
                Reader
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1" />
        
        {/* Main Navigation */}
        <div className="py-1">
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2 cursor-pointer">
            <Link href={`/profile/${userId}`} className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Profile</p>
                <p className="text-xs text-muted-foreground">View your public profile</p>
              </div>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2 cursor-pointer">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">My Library</p>
                <p className="text-xs text-muted-foreground">Manage your book collection</p>
              </div>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2 cursor-pointer">
            <Link href="/saved" className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3">
                <Bookmark className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Saved Posts</p>
                <p className="text-xs text-muted-foreground">Bookmarks and saved items</p>
              </div>
            </Link>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="my-1" />
        
        {/* Settings */}
        <div className="py-1">
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2 cursor-pointer">
            <Link href="/settings" className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center mr-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">Account and preferences</p>
              </div>
            </Link>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="my-1" />
        
        {/* Logout */}
        <div className="pt-1 pb-1">
          <DropdownMenuItem
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center mr-3">
              <LogOut className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">Log out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
