'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import {
  Phone, AtSign, ShieldCheck, Lock, Eye, EyeOff,
  Loader2, CheckCircle2, ArrowLeft,
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

export default function ForgotPasswordPage() {
  const router = useRouter();

  // 'phone' → 'reset' → 'done'
  const [step, setStep] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    const idTrimmed = String(identifier).trim();
    if (!idTrimmed) {
      toast.error('Please enter your email or phone number');
      return;
    }
    // If it looks like a phone (no @), normalize to E.164 first
    let payload;
    if (idTrimmed.includes('@')) {
      payload = { identifier: idTrimmed.toLowerCase() };
    } else {
      const e164 = normalizePhoneE164(idTrimmed);
      if (!isValidE164(e164)) {
        toast.error('Please enter a valid phone number with country code');
        return;
      }
      payload = { identifier: e164 };
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.success) {
        setUserId(json.data?.userId || '');
        setMaskedPhone(json.data?.maskedPhone || '');
        toast.success(`OTP sent to ${json.data?.maskedPhone || 'your phone'}`);
        setStep('reset');
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

  const resetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, // preferred unique identifier from step 1
          identifier: identifier.trim(),
          code: otp,
          newPassword,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success('Password reset successful!');
        setStep('done');
        setTimeout(() => { router.push('/login'); }, 1200);
      } else {
        toast.error(json?.error || 'Reset failed');
      }
    } catch (_e) {
      toast.error('Network error. Please try again.');
    } finally {
      setResetting(false);
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
          <Step active={step === 'reset'} done={step === 'done'} label="Reset" n={2} />
        </div>

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="text-center pb-4">
            {step === 'phone' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <AtSign className="w-6 h-6 text-brand-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your registered email or phone — we'll send an OTP to your verified phone.
                </p>
              </>
            )}
            {step === 'reset' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-gray-900">{maskedPhone || 'your phone'}</span>
                </p>
              </>
            )}
            {step === 'done' && (
              <>
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Password Updated</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Redirecting to login…</p>
              </>
            )}
          </CardHeader>

          <CardContent>
            {step === 'phone' && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Phone Number</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="you@example.com  or  +91 98765 43210"
                      className="pl-10 h-12"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Tip: If multiple accounts share the same phone, use your email instead.
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
                  Remember your password?{' '}
                  <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={resetPassword} className="space-y-4">
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
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      className="pl-10 pr-10 h-12"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      className="pl-10 h-12"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-base font-semibold"
                  disabled={resetting}
                >
                  {resetting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Updating…
                    </span>
                  ) : 'Reset Password'}
                </Button>

                <div className="flex items-center justify-between text-sm pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
                    className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change account
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
          Need help?{' '}
          <Link href="/contact" className="underline">Contact support</Link>
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
