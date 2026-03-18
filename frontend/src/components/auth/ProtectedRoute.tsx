'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/auth/authApi';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, token, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // If no token, redirect to login
      if (!token) {
        setIsVerifying(false);
        router.push('/?action=login');
        return;
      }

      // If already authenticated with user data, allow access
      if (isAuthenticated && user) {
        setIsVerifying(false);
        return;
      }

      // Verify token with backend
      try {
        const response = await authApi.verifyToken();
        if (!response.success || !response.data) {
          logout();
          router.push('/?action=login');
        }
      } catch {
        logout();
        router.push('/?action=login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [token, isAuthenticated, user, logout, router]);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show fallback or nothing (redirect will happen)
  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  // Authenticated - show protected content
  return <>{children}</>;
}

export default ProtectedRoute;
