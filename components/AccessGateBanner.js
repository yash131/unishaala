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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Lock,
  Phone,
  LogIn,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AccessGateBanner
 *
 * Reads the `auth` query param set by middleware redirects:
 *   - `auth=required`      → user not logged in
 *   - `auth=verify-phone`  → logged in but phone not verified
 *
 * Shows a full-width banner + dialog on the landing page with clear CTAs so the
 * user understands why they were sent back home and how to unlock the site.
 */
function AccessGateBannerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const reason = searchParams?.get('auth');
  const next = searchParams?.get('next') || '';

  const [open, setOpen] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    if (reason === 'required' || reason === 'verify-phone') {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [reason]);

  const clearQuery = () => {
    // Remove ?auth=... so the banner doesn't re-appear on refresh.
    router.replace(pathname || '/', { scroll: false });
  };

  if (!reason || (reason !== 'required' && reason !== 'verify-phone')) {
    return null;
  }

  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  const signupHref = `/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  const message =
    reason === 'required'
      ? 'Login and verify your phone number to unlock full access.'
      : 'Verify your phone number to unlock full access.';

  return (
    <>
      {/* Top Banner */}
      {!dismissedBanner && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 shadow-sm">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-amber-900 min-w-0">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{message}</span>
              </div>
              <div className="flex items-center gap-2">
                {reason === 'required' ? (
                  <>
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
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700 h-8"
                    onClick={() => setShowVerify(true)}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verify phone
                  </Button>
                )}
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

      {/* Modal dialog (shown once on arrival with ?auth=...) */}
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
              {reason === 'required' ? (
                <><Lock className="w-5 h-5 text-amber-600" /> Access restricted</>
              ) : (
                <><Phone className="w-5 h-5 text-amber-600" /> Verification needed</>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3 text-sm text-gray-700">
            <p className="text-base">
              {message}
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Access blogs, test series & job notifications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Predict your rank & track progress
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Download study PDFs & resources
              </li>
            </ul>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {reason === 'required' ? (
              <>
                <Link href={signupHref} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" /> Create account
                  </Button>
                </Link>
                <Link href={loginHref} className="flex-1">
                  <Button className="w-full bg-brand-600 hover:bg-brand-700">
                    <LogIn className="w-4 h-4 mr-2" /> Log in
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                className="w-full bg-brand-600 hover:bg-brand-700"
                onClick={() => {
                  setOpen(false);
                  setShowVerify(true);
                }}
              >
                <ShieldCheck className="w-4 h-4 mr-2" /> Verify phone number
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone verify flow for logged-in unverified users */}
      <PhoneVerifyModal
        open={showVerify}
        onOpenChange={setShowVerify}
        redirectTo={next || '/'}
      />
    </>
  );
}

function PhoneVerifyModal({ open, onOpenChange, redirectTo }) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          if (d.success) {
            setMe(d.data);
            setPhone(d.data?.phone || '');
          }
        }
      } catch (_e) {}
      setCode('');
      setStep('phone');
    })();
  }, [open]);

  const sendOtp = async () => {
    if (!phone || phone.trim().length < 8) {
      toast.error('Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phone.trim() })
      });
      const d = await res.json();
      if (d.success) {
        toast.success('OTP sent. Please check your phone.');
        setStep('code');
      } else {
        toast.error(d.error || 'Failed to send OTP');
      }
    } catch (_e) {
      toast.error('Failed to send OTP');
    }
    setSending(false);
  };

  const verifyOtp = async () => {
    if (!code || code.trim().length < 4) {
      toast.error('Enter the OTP');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-my-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() })
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Phone verified — full access unlocked');
        // Update localStorage user
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored) {
            stored.phoneVerified = true;
            stored.phone = phone.trim();
            localStorage.setItem('user', JSON.stringify(stored));
            window.dispatchEvent(new Event('userChanged'));
          }
        } catch (_e) {}
        onOpenChange(false);
        // Redirect to intended destination (or home)
        setTimeout(() => {
          if (redirectTo && redirectTo !== '/' && !redirectTo.startsWith('/?')) {
            router.push(redirectTo);
          } else {
            router.replace('/');
          }
        }, 200);
      } else {
        toast.error(d.error || 'Invalid OTP');
      }
    } catch (_e) {
      toast.error('Verification failed');
    }
    setVerifying(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand-600" />
            Verify your phone number
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          {step === 'phone' ? (
            <>
              <p className="text-sm text-gray-600">
                We&apos;ll send a one-time code to this number. Use international format (e.g. +91XXXXXXXXXX).
              </p>
              <div>
                <Label>Phone number</Label>
                <Input
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to <span className="font-medium">{phone}</span>.
              </p>
              <div>
                <Label>Verification code</Label>
                <Input
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Enter OTP"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              <button
                type="button"
                className="text-xs text-brand-600 hover:underline"
                onClick={() => setStep('phone')}
              >
                Change phone number
              </button>
            </>
          )}
        </div>
        <DialogFooter>
          {step === 'phone' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={sendOtp} disabled={sending} className="bg-brand-600 hover:bg-brand-700">
                {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('phone')} disabled={verifying}>
                Back
              </Button>
              <Button onClick={verifyOtp} disabled={verifying} className="bg-brand-600 hover:bg-brand-700">
                {verifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : 'Verify & unlock'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccessGateBanner() {
  // Wrap in Suspense because useSearchParams requires it in some rendering modes
  return (
    <Suspense fallback={null}>
      <AccessGateBannerInner />
    </Suspense>
  );
}
