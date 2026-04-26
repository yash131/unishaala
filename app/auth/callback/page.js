'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          toast.error('Authentication failed - no session ID');
          router.push('/login');
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for user data via backend
        const response = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        const result = await response.json();

        if (result.success) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(result.data.user));
          toast.success('Login successful!');
          
          // Redirect based on role
          if (result.data.user.role === 'SUPER_ADMIN' || result.data.user.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } else {
          toast.error(result.error || 'Authentication failed');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Something went wrong');
        router.push('/login');
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}
