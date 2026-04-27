'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainNavbar } from '@/components/MainNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Loader2, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function GetPassPage() {
  const router = useRouter();
  const [cfg, setCfg] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, meRes] = await Promise.all([
          fetch('/api/pricing'),
          fetch('/api/auth/me', { credentials: 'include' })
        ]);
        const c = await cRes.json();
        const m = await meRes.json();
        if (c.success) setCfg(c.data);
        if (m.success) setMe(m.data);
      } catch (_e) { toast.error('Failed to load'); }
      setLoading(false);
    })();
  }, []);

  const hasActivePass = !!me?.hasPass && (!me.passExpiresAt || new Date(me.passExpiresAt) > new Date());

  const handleBuyPass = async () => {
    if (!me?.id) { router.push('/login?next=/get-pass'); return; }
    if (!cfg?.getPassEnabled || !cfg?.getPassPrice) {
      toast.error('Get Pass is not available right now. Please check back later.');
      return;
    }
    setPaying(true);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentType: 'get_pass', amount: cfg.getPassPrice })
      });
      const d = await res.json();
      if (!d.success) { toast.error(d.error || 'Failed to create order'); setPaying(false); return; }

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject;
          document.body.appendChild(s);
        });
      }
      const { orderId, keyId, name, description, prefill, amount, currency } = d.data;
      const rzp = new window.Razorpay({
        key: keyId,
        amount, currency, name, description,
        order_id: orderId,
        prefill,
        theme: { color: '#E11D5D' },
        handler: async function (response) {
          try {
            const v = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const vd = await v.json();
            if (vd.success) window.location.href = `/payment/success?txn=${response.razorpay_payment_id}`;
            else window.location.href = `/payment/failed?reason=${encodeURIComponent(vd.error || 'Verification failed')}`;
          } catch (err) {
            window.location.href = `/payment/failed?reason=${encodeURIComponent(err.message)}`;
          }
        },
        modal: { ondismiss: () => setPaying(false) }
      });
      rzp.on('payment.failed', (resp) => {
        window.location.href = `/payment/failed?reason=${encodeURIComponent(resp.error?.description || 'Payment failed')}`;
      });
      rzp.open();
    } catch (err) {
      toast.error('Payment could not be started');
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      <MainNavbar />
      <div className="pt-24 pb-12 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow-lg mb-4">
              <Crown className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Unishaala Get Pass</h1>
            <p className="text-gray-600 mt-3 text-lg">One pass — every Test Series, every Domain, every Previous Year Paper on Unishaala.</p>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : hasActivePass ? (
            <Card className="border-2 border-amber-300 shadow-xl">
              <CardContent className="p-8 text-center">
                <Badge className="bg-amber-500 text-white"><Crown className="w-3 h-3 mr-1" /> Active Pass</Badge>
                <h2 className="text-2xl font-bold text-gray-900 mt-4">You already have an active Get Pass</h2>
                {me.passExpiresAt && (
                  <p className="text-sm text-gray-600 mt-2 flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" /> Valid until {new Date(me.passExpiresAt).toLocaleDateString()}
                  </p>
                )}
                <p className="text-gray-600 mt-4">All Test Series, Domains, and Previous Year papers are unlocked for you.</p>
                <Link href="/dashboard" className="inline-block mt-6">
                  <Button className="bg-brand-600 hover:bg-brand-700">Go to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-amber-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-white text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Most complete plan — unlocks everything on the platform
              </div>
              <CardContent className="p-8">
                <div className="flex items-end gap-2 justify-center">
                  <span className="text-5xl font-extrabold text-gray-900">₹{Math.round(cfg?.getPassPrice || 0).toLocaleString('en-IN')}</span>
                  <span className="text-gray-500 pb-2">/ 1 year</span>
                </div>
                <ul className="mt-6 space-y-3 max-w-md mx-auto">
                  {[
                    'Unlocks every Test Series across all exams',
                    'Unlocks every Domain inside every exam',
                    'Unlocks every Previous Year Question paper',
                    'Practice Questions are always free too',
                    'Full solutions, ranks & analytics on Dashboard',
                    'Valid for 12 months from purchase',
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col items-center gap-3">
                  <Button onClick={handleBuyPass} disabled={paying || !cfg?.getPassEnabled || !cfg?.getPassPrice}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-8 py-6 h-auto shadow-lg">
                    {paying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirecting…</> : <><Crown className="w-5 h-5 mr-2" /> Get Pass Now</>}
                  </Button>
                  {(!cfg?.getPassEnabled || !cfg?.getPassPrice) && (
                    <p className="text-sm text-amber-700">Get Pass is not enabled yet. Please check back soon.</p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secured by Razorpay
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
