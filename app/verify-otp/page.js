'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { Phone, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Normalize a phone string to E.164. Defaults to +91 (India) when no country code is given.
function normalizePhoneE164(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim().replace(/\s|-/g, '');
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  // No '+' provided — assume India by default if it's 10 digits
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits.startsWith('91')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get('next') || '';
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '';

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [bootstrapping, setBootstrapping] = useState(true);

  // On mount: hydrate from /api/auth/me; if not logged in send to /login.
  // If already verified, send to home/next. Otherwise prefill phone from profile.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          router.replace('/login' + (safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''));
          return;
        }
        const json = await res.json();
        const user = json?.data || {};
        if (cancelled) return;

        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
        if (isAdmin) {
          router.replace('/admin');
          return;
        }
        if (user.phoneVerified === true) {
          router.replace(safeNext || '/');
          return;
        }
        if (user.phone) {
          setPhone(user.phone);
        }
      } catch (_e) {
        // network — leave on this page
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, safeNext]);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    const e164 = normalizePhoneE164(phone);
    if (!e164 || e164.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: e164 }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success('OTP sent to ' + e164);
        setPhone(e164);
        setStep('otp');
        setResendIn(30);
      } else {
        toast.error(json?.error || 'Failed to send OTP');
      }
    } catch (_e) {
      toast.error('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!code || code.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-my-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success('Phone verified successfully!');
        // Update local user
        try {
          const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
          if (meRes.ok) {
            const me = await meRes.json();
            if (me?.data) {
              localStorage.setItem('user', JSON.stringify({
                id: me.data.id,
                name: me.data.name,
                email: me.data.email,
                phone: me.data.phone,
                role: me.data.role,
                phoneVerified: true,
              }));
            }
          }
        } catch (_) {}
        // Redirect — full reload so the new cookie/JWT is picked up by middleware
        const target = safeNext || '/';
        window.location.href = target;
      } else {
        toast.error(json?.error || 'Invalid OTP');
      }
    } catch (_e) {
      toast.error('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    router.replace('/login');
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-brand-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'phone'
                ? 'For your security, please verify your phone number to continue.'
                : `We sent a 6-digit code to ${phone}`}
            </p>
          </CardHeader>

          <CardContent>
            {step === 'phone' && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="pl-10 h-12"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Include country code (e.g., +91 for India). 10-digit Indian numbers are auto-prefixed.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-lg"
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">6-Digit OTP</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="123456"
                    className="h-12 text-center text-2xl tracking-[0.5em] font-semibold"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-lg"
                  disabled={verifying}
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                </Button>

                <div className="flex items-center justify-between text-sm pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setCode(''); }}
                    className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change number
                  </button>

                  <button
                    type="button"
                    onClick={() => { if (resendIn === 0) sendOtp(); }}
                    disabled={resendIn > 0 || sending}
                    className="text-brand-600 disabled:text-gray-400 hover:underline"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              <button
                type="button"
                onClick={handleLogout}
                className="hover:underline"
              >
                Sign out
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          By verifying, you agree to our{' '}
          <Link href="/terms-of-service" className="underline">Terms</Link> and{' '}
          <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
