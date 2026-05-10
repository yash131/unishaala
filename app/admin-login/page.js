'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Skip if already an admin
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;
    try {
      const u = JSON.parse(user);
      if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') router.push('/admin');
    } catch (_) {}
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || 'Login failed');
        setLoading(false);
        return;
      }
      const u = json.data?.user || {};
      if (u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') {
        toast.error('Not an admin account');
        setLoading(false);
        return;
      }
      localStorage.setItem('user', JSON.stringify(u));
      toast.success('Welcome back, admin!');
      router.push('/admin');
    } catch (_) {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="large" showText={false} />
        </div>

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-700" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              For platform staff only. Regular users — <Link href="/login" className="text-brand-600 hover:underline">sign in here</Link>.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Admin email"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="pl-10 pr-10 h-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <Button
                type="submit"
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-base font-semibold"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Need help? <Link href="/contact" className="underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
