'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get('next') || '';
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '';
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP verification
  const [otpSending, setOtpSending] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Format phone number to E.164 format
  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If doesn't start with country code, add India's +91
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return '+' + cleaned;
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    // Valid if 10 digits (Indian) or 12+ digits (with country code)
    return cleaned.length >= 10;
  };

  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setOtpSending(true);

    try {
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTP sent to your phone!');
        setStep(2);
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      // First verify OTP
      const verifyResponse = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code: otp })
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        toast.error(verifyResult.error || 'Invalid OTP');
        setLoading(false);
        return;
      }

      // If OTP verified, proceed with signup
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formattedPhone,
          phoneVerified: true
        })
      });

      const signupResult = await signupResponse.json();

      if (signupResult.success) {
        toast.success('Account created successfully! Please login.');
        router.push(`/login${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`);
      } else {
        toast.error(signupResult.error || 'Signup failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleResendOTP = async () => {
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="large" showText={false} />
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {step === 1 ? 'Create Account' : 'Verify Phone Number'}
            </CardTitle>
            <p className="text-gray-500">
              {step === 1 
                ? 'Join thousands of students preparing for success' 
                : `Enter the OTP sent to ${formData.phone}`
              }
            </p>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <>
                {/* Google Signup Button */}
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-6 border-gray-300 hover:bg-gray-50"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">or sign up with phone</span>
                  </div>
                </div>

                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10 h-12"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 h-12"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone (e.g., 9876543210)"
                        className="pl-10 h-12"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">We'll send an OTP to verify your phone number</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="pl-10 pr-10 h-12"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-lg"
                    disabled={otpSending || !formData.name || !formData.email || !formData.phone || !formData.password}
                  >
                    {otpSending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP & Continue'}
                  </Button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyAndSignup} className="space-y-4">
                <div className="bg-brand-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-brand-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">OTP sent to {formData.phone}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Didn't receive OTP?</span>
                  <button 
                    type="button" 
                    className="text-brand-600 hover:underline font-medium"
                    onClick={handleResendOTP}
                    disabled={otpSending}
                  >
                    {otpSending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-lg"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
                </Button>

                <button 
                  type="button" 
                  className="w-full text-gray-600 hover:underline py-2"
                  onClick={() => { setStep(1); setOtp(''); }}
                >
                  ← Go back & change phone number
                </button>
              </form>
            )}

            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
