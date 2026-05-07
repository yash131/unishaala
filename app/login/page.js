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
  Eye, EyeOff, Mail, Lock, Phone, Loader2,
  ShieldCheck, ArrowLeft, CheckCircle2,
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
  const safeNext = (() => {
    if (!nextUrl) return '';
    if (!nextUrl.startsWith('/') || nextUrl.startsWith('//')) return '';
    return nextUrl;
  })();

  // Steps: 'login' → 'otp' → 'done'
  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // OTP step state
  const [phone, setPhone] = useState('');
  const [phoneEditable, setPhoneEditable] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Auto-redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const u = JSON.parse(user);
        const isAdmin = u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
        if (isAdmin) router.push('/admin');
        else if (u.phoneVerified !== true) {
          // stay on login but advance to OTP step with existing phone
          setPhone(u.phone || '');
          setPhoneEditable(!u.phone);
          setStep('otp');
        } else if (safeNext) router.push(safeNext);
        else router.push('/');
      } catch (_) {}
    }
  }, [router, safeNext]);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // STEP 1: Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      const user = result.data?.user || {};
      localStorage.setItem('user', JSON.stringify(user));
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

      if (isAdmin) {
        toast.success('Welcome back, admin!');
        router.push('/admin');
        return;
      }

      if (user.phoneVerified === true) {
        toast.success('Login successful!');
        router.push(safeNext || '/');
        return;
      }

      // User must verify phone
      toast.success('Login successful — please verify your phone');
      setPhone(user.phone || '');
      setPhoneEditable(!user.phone);
      setStep('otp');
      setLoading(false);
      // Auto-send OTP if phone is on file
      if (user.phone && isValidE164(user.phone)) {
        sendOtp(user.phone);
      }
    } catch (_err) {
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  const sendOtp = async (phoneE164) => {
    const e164 = normalizePhoneE164(phoneE164 || phone);
    if (!isValidE164(e164)) {
      toast.error('Please enter a valid phone number with country code');
      return false;
    }
    setOtpSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: e164 }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success(`OTP sent to ${e164}`);
        setPhone(e164);
        setOtpSent(true);
        setResendIn(30);
        return true;
      }
      toast.error(json?.error || 'Failed to send OTP');
      return false;
    } catch (_e) {
      toast.error('Network error sending OTP');
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-my-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code: otp }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success('Phone verified!');
        try {
          const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
          if (meRes.ok) {
            const me = await meRes.json();
            if (me?.data) {
              localStorage.setItem('user', JSON.stringify({
                id: me.data.id, name: me.data.name, email: me.data.email,
                phone: me.data.phone, role: me.data.role, phoneVerified: true,
              }));
            }
          }
        } catch (_) {}
        setStep('done');
        setTimeout(() => { window.location.href = safeNext || '/'; }, 800);
      } else {
        toast.error(json?.error || 'Invalid OTP');
      }
    } catch (_e) {
      toast.error('Network error. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/';
    window.location.href = `/api/auth/google/start?next=${encodeURIComponent(next)}`;
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (_) {}
    localStorage.removeItem('user');
    setStep('login');
    setOtp(''); setOtpSent(false); setPhone('');
    setFormData({ email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="large" showText={false} />
        </div>

        {/* Stepper visible only when verifying */}
        {step !== 'login' && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <Step active={false} done label="Login" n={1} />
            <div className="h-0.5 w-10 bg-brand-600" />
            <Step active={step === 'otp'} done={step === 'done'} label="Verify Phone" n={2} />
          </div>
        )}

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="text-center pb-4">
            {step === 'login' && (
              <>
                <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Login to continue your preparation</p>
              </>
            )}
            {step === 'otp' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {otpSent
                    ? <>We sent a 6-digit code to <span className="font-semibold text-gray-900">{phone}</span></>
                    : 'Confirm your phone number to continue'}
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
            {step === 'login' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-5 border-gray-300 hover:bg-gray-50"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <GoogleIcon />
                      Continue with Google
                    </>
                  )}
                </Button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-white px-3 text-gray-400">or login with email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <Field
                    icon={<Mail className="w-5 h-5 text-gray-400" />}
                    id="email" type="email" placeholder="Email address"
                    value={formData.email}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                    required
                  />
                  <div className="relative">
                    <Field
                      icon={<Lock className="w-5 h-5 text-gray-400" />}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(v) => setFormData({ ...formData, password: v })}
                      required
                      paddingRight
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-gray-600">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-brand-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 'otp' && (
              <div className="space-y-5">
                {/* Phone confirm/edit panel */}
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
                      disabled={!phoneEditable && otpSent}
                    />
                  </div>
                  {!phoneEditable && otpSent && (
                    <button
                      type="button"
                      onClick={() => { setPhoneEditable(true); setOtpSent(false); setOtp(''); }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Change number
                    </button>
                  )}
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={() => sendOtp()}
                    className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                    disabled={otpSending}
                  >
                    {otpSending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Sending OTP…
                      </span>
                    ) : 'Send OTP'}
                  </Button>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="• • • • • •"
                        className="h-14 text-center text-2xl tracking-[0.5em] font-bold"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                      disabled={otpVerifying}
                    >
                      {otpVerifying ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> Verifying…
                        </span>
                      ) : 'Verify & Continue'}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to login
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (resendIn === 0 && !otpSending) sendOtp(); }}
                        disabled={resendIn > 0 || otpSending}
                        className="text-brand-600 disabled:text-gray-400 font-medium hover:underline"
                      >
                        {otpSending
                          ? 'Sending…'
                          : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
      </div>
    </div>
  );
}

// ─────────────────────────── helpers ───────────────────────────
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

function Field({ icon, id, type, placeholder, value, onChange, required, paddingRight }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`pl-10 h-12 ${paddingRight ? 'pr-10' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
