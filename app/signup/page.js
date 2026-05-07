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
  Eye, EyeOff, Mail, Lock, User, Phone, Loader2,
  ShieldCheck, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// Normalize a phone string to E.164. Auto-prefix +91 for plain 10-digit numbers.
function normalizePhoneE164(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim().replace(/\s|-/g, '');
  if (trimmed.startsWith('+')) return '+' + trimmed.slice(1).replace(/\D/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits.startsWith('91')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

function isValidE164(s) {
  return /^\+\d{10,15}$/.test(s || '');
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get('next') || '';
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '';

  // Steps: 'form' → 'otp' → 'done'
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

  // OTP step state
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Send OTP via Twilio Verify
  const sendOtp = async (phoneE164) => {
    const e164 = phoneE164 || verifiedPhone;
    if (!isValidE164(e164)) {
      toast.error('Invalid phone number format');
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

  // STEP 1: Submit signup form, create account, auto-send OTP
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const e164Phone = normalizePhoneE164(formData.phone);
    if (!isValidE164(e164Phone)) {
      toast.error('Please enter a valid phone number with country code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: e164Phone,
          password: formData.password,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Signup failed');
        setLoading(false);
        return;
      }

      if (result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
      setVerifiedPhone(e164Phone);
      // Auto-send OTP
      const sent = await sendOtp(e164Phone);
      if (sent) {
        setStep('otp');
      } else {
        // Account exists but OTP failed → still go to OTP step so user can retry
        setStep('otp');
      }
    } catch (_err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP — once verified, persist phoneVerified and redirect
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
        body: JSON.stringify({ phone: verifiedPhone, code: otp }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success('Phone verified! Welcome aboard.');
        // Update local user with phoneVerified:true
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
        // Full reload so middleware picks up the refreshed JWT
        setTimeout(() => { window.location.href = safeNext || '/'; }, 800);
      } else {
        toast.error(json?.error || 'Invalid OTP. Please try again.');
      }
    } catch (_e) {
      toast.error('Network error. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/';
    window.location.href = `/api/auth/google/start?next=${encodeURIComponent(next)}`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="large" showText={false} />
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Step active={step === 'form'} done={step !== 'form'} label="Account" n={1} />
          <div className={`h-0.5 w-10 ${step !== 'form' ? 'bg-brand-600' : 'bg-gray-300'}`} />
          <Step active={step === 'otp'} done={step === 'done'} label="Verify Phone" n={2} />
        </div>

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="text-center pb-4">
            {step === 'form' && (
              <>
                <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Join thousands of students preparing for success</p>
              </>
            )}
            {step === 'otp' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-gray-900">{verifiedPhone}</span>
                </p>
              </>
            )}
            {step === 'done' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">All Set!</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Redirecting you to your dashboard…</p>
              </>
            )}
          </CardHeader>

          <CardContent>
            {step === 'form' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-5 border-gray-300 hover:bg-gray-50"
                  onClick={handleGoogleSignup}
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
                    <span className="bg-white px-3 text-gray-400">or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <Field
                    icon={<User className="w-5 h-5 text-gray-400" />}
                    id="name" type="text" placeholder="Full name"
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                    required
                  />
                  <Field
                    icon={<Mail className="w-5 h-5 text-gray-400" />}
                    id="email" type="email" placeholder="Email address"
                    value={formData.email}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                    required
                  />
                  <div>
                    <Field
                      icon={<Phone className="w-5 h-5 text-gray-400" />}
                      id="phone" type="tel" placeholder="Phone number (e.g. +91 98765 43210)"
                      value={formData.phone}
                      onChange={(v) => setFormData({ ...formData, phone: v })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5 ml-1">
                      Required for account verification. 10-digit Indian numbers auto-prefix with +91.
                    </p>
                  </div>
                  <div className="relative">
                    <Field
                      icon={<Lock className="w-5 h-5 text-gray-400" />}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password (min 6 characters)"
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

                  <Button
                    type="submit"
                    className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Creating account…
                      </span>
                    ) : 'Create Account & Send OTP'}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                      Login
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
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
                    onClick={() => { setStep('form'); setOtp(''); }}
                    className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Edit details
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (resendIn === 0 && !otpSending) sendOtp(verifiedPhone); }}
                    disabled={resendIn > 0 || otpSending}
                    className="text-brand-600 disabled:text-gray-400 font-medium hover:underline"
                  >
                    {otpSending
                      ? 'Sending…'
                      : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center pt-2">
                  Didn't receive the code? Check spam folder or try resending. Make sure you can receive SMS.
                </p>
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
      </div>
    </div>
  );
}

// ─────────────────────────── helpers ───────────────────────────
function Step({ active, done, label, n }) {
  const base = 'flex items-center gap-2';
  const dotBase = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors';
  let dotCls = 'bg-gray-200 text-gray-500';
  if (active) dotCls = 'bg-brand-600 text-white';
  else if (done) dotCls = 'bg-green-500 text-white';
  return (
    <div className={base}>
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
