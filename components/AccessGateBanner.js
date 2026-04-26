'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Lock, LogIn, Sparkles, X } from 'lucide-react';

/**
 * AccessGateBanner
 *
 * Reads the `auth` query param set by middleware redirects:
 *   - `auth=required` → user not logged in (only case we still gate on)
 *
 * Phone verification is no longer required to access the site, so the
 * verify-phone flow has been removed from this component.
 */
function AccessGateBannerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const reason = searchParams?.get('auth');
  const next = searchParams?.get('next') || '';

  const [open, setOpen] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    setOpen(reason === 'required');
  }, [reason]);

  const clearQuery = () => {
    router.replace(pathname || '/', { scroll: false });
  };

  if (reason !== 'required') {
    return null;
  }

  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  const signupHref = `/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <>
      {/* Top banner */}
      {!dismissedBanner && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 shadow-sm">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-amber-900 min-w-0">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Login to unlock full access.</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={loginHref}>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700 h-8">
                    <LogIn className="w-3.5 h-3.5 mr-1" /> Login
                  </Button>
                </Link>
                <Link href={signupHref} className="hidden sm:block">
                  <Button size="sm" variant="outline" className="h-8">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Sign up
                  </Button>
                </Link>
                <button
                  onClick={() => setDismissedBanner(true)}
                  className="p-1 rounded-full hover:bg-amber-100 text-amber-700"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) clearQuery();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" /> Login to get full access
            </DialogTitle>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href={signupHref} className="flex-1">
              <Button variant="outline" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" /> Sign Up
              </Button>
            </Link>
            <Link href={loginHref} className="flex-1">
              <Button className="w-full bg-brand-600 hover:bg-brand-700">
                <LogIn className="w-4 h-4 mr-2" /> Log In
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AccessGateBanner() {
  return (
    <Suspense fallback={null}>
      <AccessGateBannerInner />
    </Suspense>
  );
}
