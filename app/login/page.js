'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import {
  Phone, ShieldCheck, Loader2, ArrowLeft, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

function normalizePhoneE164(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim().replace(/\s|-/g, '');
  if (trimmed.startsWith('+')) return '+' + trimmed.slice(1).replace(/\D/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits.startsWith('91')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}
function isValidE164(s) { return /^\+\d{10,15}$/.test(s || ''); }

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') || '';
  const safeNext = (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')) ? nextUrl : '';

  // 'phone' → 'otp' → 'done'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [forceConfirm, setForceConfirm] = useState(false); // showing "Continue here" after 409

  // Auto-redirect if already logged in (and verified)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;
    try {
      const u = JSON.parse(user);
      const isAdmin = u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
      if (isAdmin) router.push('/admin');
      else if (u.phoneVerified === true) router.push(safeNext || '/');
    } catch (_) {}
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
    if (!isValidE164(e164)) {
      toast.error('Please enter a valid phone number with country code');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/login-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: e164 }),
      });
      const json = await res.json();
      if (json?.success) {
        setPhone(e164);
        setMaskedPhone(json.data?.maskedPhone || e164);
        setStep('otp');
        setResendIn(30);
        toast.success(`OTP sent to ${json.data?.maskedPhone || e164}`);
      } else if (json?.code === 'ACCOUNT_NOT_FOUND') {
        toast.error('No account found. Redirecting to signup…');
        setTimeout(() => router.push('/signup' + (safeNext ? `?next=${encodeURIComponent(safeNext)}` : '')), 1500);
      } else {
        toast.error(json?.error || 'Failed to send OTP');
      }
    } catch (_) {
      toast.error('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (e, force = false) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/login-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code: otp, forceLogout: !!force }),
      });
      const json = await res.json();

      if (res.status === 409 && json?.code === 'ALREADY_LOGGED_IN') {
        // Show "Continue here" option to force-logout the other device
        setForceConfirm(true);
        toast.error(json?.error || 'Already logged in on another device');
        return;
      }

      if (json?.success) {
        const u = json.data?.user || {};
        localStorage.setItem('user', JSON.stringify(u));
        toast.success('Login successful!');
        setStep('done');
        setTimeout(() => { window.location.href = safeNext || '/'; }, 700);
      } else {
        toast.error(json?.error || 'Verification failed');
      }
    } catch (_) {
      toast.error('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="large" showText={false} />
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Step active={step === 'phone'} done={step !== 'phone'} label="Phone" n={1} />
          <div className={`h-0.5 w-10 ${step !== 'phone' ? 'bg-brand-600' : 'bg-gray-300'}`} />
          <Step active={step === 'otp'} done={step === 'done'} label="Verify" n={2} />
        </div>

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="text-center pb-4">
            {step === 'phone' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-brand-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Login with your phone number — we'll send you an OTP.
                </p>
              </>
            )}
            {step === 'otp' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Enter OTP</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-gray-900">{maskedPhone}</span>
                </p>
              </>
            )}
            {step === 'done' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Verified!</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Redirecting…</p>
              </>
            )}
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
                    Include country code. 10-digit Indian numbers auto-prefix with +91.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                  disabled={sending}
                >
                  {sending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Sending OTP…
                    </span>
                  ) : 'Send OTP'}
                </Button>

                <p className="text-center text-sm text-gray-600 pt-2">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
                    Sign Up
                  </Link>
                </p>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={(e) => verifyOtp(e, false)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="• • • • • •"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-bold"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setForceConfirm(false); }}
                    autoFocus
                    required
                  />
                </div>

                {forceConfirm && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 flex-1">
                      <p className="font-semibold">Already logged in on another device.</p>
                      <p className="text-amber-700 mt-0.5">
                        Click "Continue here" to log out of the other device and sign in here.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => verifyOtp(null, true)}
                        disabled={verifying}
                      >
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue here →'}
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                  disabled={verifying}
                >
                  {verifying ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Verifying…
                    </span>
                  ) : 'Verify & Login'}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setForceConfirm(false); }}
                    className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change number
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (resendIn === 0 && !sending) sendOtp(); }}
                    disabled={resendIn > 0 || sending}
                    className="text-brand-600 disabled:text-gray-400 font-medium hover:underline"
                  >
                    {sending ? 'Sending…' : (resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP')}
                  </button>
                </div>
              </form>
            )}

            {step === 'done' && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms-of-service" className="underline">Terms</Link> and{' '}
          <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
        <p className="text-center text-[11px] text-gray-400 mt-3">
          <Link href="/admin-login" className="hover:text-gray-600">Admin login</Link>
        </p>
      </div>
    </div>
  );
}

function Step({ active, done, label, n }) {
  const dotBase = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors';
  let dotCls = 'bg-gray-200 text-gray-500';
  if (active) dotCls = 'bg-brand-600 text-white';
  else if (done) dotCls = 'bg-green-500 text-white';
  return (
    <div className="flex items-center gap-2">
      <span className={`${dotBase} ${dotCls}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </span>
      <span className={`text-xs font-medium ${active ? 'text-brand-700' : done ? 'text-green-700' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}
