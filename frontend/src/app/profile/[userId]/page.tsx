'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/social';
import { ProtectedRoute } from '@/components/auth';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  return (
    <ProtectedRoute>
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Profile Content */}
        <UserProfile />
      </div>
    </ProtectedRoute>
  );
}
