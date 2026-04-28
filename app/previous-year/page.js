'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  GraduationCap, ArrowLeft, ArrowRight, Loader2, Layers,
  Target, FileText, Clock, ChevronRight, CheckCircle, BookOpen, Lock, Crown, ShieldCheck,
  Download, Eye
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Exam', 'Domain', 'Tests'];

export default function PreviousYearPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState([]);
  const [domains, setDomains] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Access flags
  const [me, setMe] = useState(null);
  const [purchasedPyqExams, setPurchasedPyqExams] = useState(new Set());
  const [purchasedPyqDomains, setPurchasedPyqDomains] = useState(new Set());
  const [unlockOpen, setUnlockOpen] = useState(false);

  const hasActivePass = !!me?.hasPass && (!me.passExpiresAt || new Date(me.passExpiresAt) > new Date());
  const examUnlocked = !!selectedExam && (hasActivePass || purchasedPyqExams.has(selectedExam.id));
  const domainUnlocked = !!selectedDomain && (examUnlocked || purchasedPyqDomains.has(selectedDomain.id));

  const loadAccess = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      const d = await r.json();
      if (d.success && d.data) {
        setMe(d.data);
        setPurchasedPyqExams(new Set(d.data.purchasedPyqExams || []));
        setPurchasedPyqDomains(new Set(d.data.purchasedPyqDomains || []));
      }
    } catch (_e) {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/exams');
        const d = await r.json();
        if (d.success) setExams(d.data || []);
      } catch (_e) { toast.error('Failed to load exams'); }
      setLoading(false);
    })();
    loadAccess();
  }, [loadAccess]);

  const pickExam = async (exam) => {
    setSelectedExam(exam);
    setSelectedDomain(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/exams/${exam.slug || exam.id}`);
      const d = await r.json();
      if (d.success) {
        const list = d.data?.domains || d.data?.exam?.domains || d.domains || [];
        setDomains(list);
      }
    } catch (_e) { toast.error('Failed to load domains'); }
    setLoading(false);
    setStep(1);
  };

  const pickDomain = async (domain) => {
    setSelectedDomain(domain);
    setLoading(true);
    try {
      const r = await fetch(`/api/previous-year-tests?examId=${selectedExam.id}&domainId=${domain.id}`);
      const d = await r.json();
      if (d.success) setTests(d.data || []);
    } catch (_e) { toast.error('Failed to load tests'); }
    setLoading(false);
    setStep(2);
  };

  const goBack = () => {
    if (step === 0) { router.push('/'); return; }
    setStep(step - 1);
  };

  const handleBuyExamFromCard = async (exam) => {
    if (!me?.id) { router.push('/login?next=/previous-year'); return; }
    const price = Number(exam?.pyqPrice || 0);
    if (!price) { toast.error('Price not set yet.'); return; }
    setSelectedExam(exam);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentType: 'exam_pyq_purchase', examId: exam.id, amount: price })
      });
      const d = await res.json();
      if (!d.success) { toast.error(d.error || 'Failed to create order'); return; }
      await ensureRzp();
      const { orderId, keyId, name, description, prefill, amount, currency } = d.data;
      const rzp = new window.Razorpay({
        key: keyId,
        amount, currency, name, description,
        order_id: orderId, prefill,
        theme: { color: '#7c3aed' },
        handler: async function (response) {
          try {
            const v = await fetch('/api/payment/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const vd = await v.json();
            if (vd.success) {
              toast.success(`Unlocked full PYQ access for ${exam.name}`);
              await loadAccess();
            } else {
              window.location.href = `/payment/failed?reason=${encodeURIComponent(vd.error || 'Verification failed')}`;
            }
          } catch (err) {
            window.location.href = `/payment/failed?reason=${encodeURIComponent(err.message)}`;
          }
        },
      });
      rzp.on('payment.failed', (resp) => toast.error(resp.error?.description || 'Payment failed'));
      rzp.open();
    } catch (err) {
      toast.error('Could not start payment');
    }
  };

  const handleStartTest = (t) => {
    if (t.isFree || domainUnlocked || examUnlocked || hasActivePass) {
      router.push(`/practice-test/${t.id}`);
    } else {
      setUnlockOpen(true);
    }
  };

  const handlePdfAction = async (t) => {
    if (!t?.pdfFileId) return;
    if (t.pdfPermission === 'view_download') {
      // Trigger download via blob save
      try {
        const res = await fetch(`/api/pdfs/${t.pdfFileId}/download`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) { router.push('/login?next=/previous-year'); return; }
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || 'Could not download PDF');
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = t.pdfFileName || `${t.title || 'pyq'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        toast.error('Failed to download PDF');
      }
    } else {
      // View only — open full PDF in new tab (auth required by API)
      window.open(`/api/pdfs/${t.pdfFileId}/full`, '_blank', 'noopener,noreferrer');
    }
  };

  const ensureRzp = async () => {
    if (window.Razorpay) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve; s.onerror = reject;
      document.body.appendChild(s);
    });
  };

  const handlePayment = async (kind) => {
    if (!me?.id) { router.push('/login?next=/previous-year'); return; }
    const examPrice = Number(selectedExam?.pyqPrice || 0);
    const domainPrice = Number(selectedDomain?.pyqPrice || 0);
    const payload = kind === 'exam'
      ? { paymentType: 'exam_pyq_purchase', examId: selectedExam.id, amount: examPrice }
      : { paymentType: 'domain_pyq_purchase', domainId: selectedDomain.id, amount: domainPrice };

    if (!payload.amount || payload.amount <= 0) {
      toast.error('This item is not available for purchase yet.');
      return;
    }
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (!d.success) { toast.error(d.error || 'Failed to create order'); return; }
      await ensureRzp();
      const { orderId, keyId, name, description, prefill, amount, currency } = d.data;
      const rzp = new window.Razorpay({
        key: keyId,
        amount, currency, name, description,
        order_id: orderId, prefill,
        theme: { color: '#7c3aed' },
        handler: async function (response) {
          try {
            const v = await fetch('/api/payment/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const vd = await v.json();
            if (vd.success) {
              toast.success('Payment successful! Content unlocked.');
              setUnlockOpen(false);
              await loadAccess();
            } else {
              window.location.href = `/payment/failed?reason=${encodeURIComponent(vd.error || 'Verification failed')}`;
            }
          } catch (err) {
            window.location.href = `/payment/failed?reason=${encodeURIComponent(err.message)}`;
          }
        },
      });
      rzp.on('payment.failed', (resp) => {
        toast.error(resp.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      toast.error('Could not start payment');
    }
  };

  const handleBuyDomainFromCard = async (dom) => {
    if (!me?.id) { router.push('/login?next=/previous-year'); return; }
    const price = Number(dom?.pyqPrice || 0);
    if (!price) { toast.error('Price not set yet.'); return; }
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentType: 'domain_pyq_purchase', domainId: dom.id, amount: price })
      });
      const d = await res.json();
      if (!d.success) { toast.error(d.error || 'Failed to create order'); return; }
      await ensureRzp();
      const { orderId, keyId, name, description, prefill, amount, currency } = d.data;
      const rzp = new window.Razorpay({
        key: keyId, amount, currency, name, description,
        order_id: orderId, prefill,
        theme: { color: '#7c3aed' },
        handler: async function (response) {
          try {
            const v = await fetch('/api/payment/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const vd = await v.json();
            if (vd.success) {
              toast.success(`Unlocked PYQs for ${dom.name}`);
              await loadAccess();
            } else {
              window.location.href = `/payment/failed?reason=${encodeURIComponent(vd.error || 'Verification failed')}`;
            }
          } catch (err) {
            window.location.href = `/payment/failed?reason=${encodeURIComponent(err.message)}`;
          }
        },
      });
      rzp.on('payment.failed', (resp) => toast.error(resp.error?.description || 'Payment failed'));
      rzp.open();
    } catch (err) {
      toast.error('Could not start payment');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-white to-white">
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-600" /> Previous Year Questions
            </h1>
            <p className="text-gray-600 mt-2">Authentic previous year papers with full solutions.</p>
          </div>
          {hasActivePass ? (
            <Badge className="bg-amber-500 text-white flex items-center gap-1 text-sm py-1.5 px-3">
              <Crown className="w-4 h-4" /> Get Pass active
            </Badge>
          ) : (
            <Link href="/get-pass"><Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50"><Crown className="w-4 h-4 mr-2" /> Get Pass</Button></Link>
          )}
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                idx < step ? 'bg-green-50 border-green-300 text-green-700' :
                idx === step ? 'bg-purple-50 border-purple-400 text-purple-700' :
                'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < step ? 'bg-green-500 text-white' :
                  idx === step ? 'bg-purple-600 text-white' :
                  'bg-gray-300 text-white'
                }`}>
                  {idx < step ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
              {idx < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Breadcrumb */}
        {step > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            {selectedExam && <Badge variant="outline" className="px-3 py-1">{selectedExam.name}</Badge>}
            {selectedDomain && <><ChevronRight className="w-3 h-3 text-gray-400" /><Badge variant="outline" className="px-3 py-1 bg-purple-50 border-purple-200 text-purple-700">{selectedDomain.name}</Badge></>}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={goBack}><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {step === 0 && <ExamPicker exams={exams} purchasedPyqExams={purchasedPyqExams} hasActivePass={hasActivePass} onPick={pickExam} onBuy={handleBuyExamFromCard} />}
            {step === 1 && (
              <>
                {/* Exam-level Buy banner */}
                {selectedExam && !examUnlocked && !hasActivePass && Number(selectedExam.pyqPrice) > 0 && (
                  <BuyBanner
                    color="amber"
                    title={`Unlock all PYQs for ${selectedExam.name}`}
                    subtitle="Full access to every domain's PYQ papers under this exam."
                    amount={Number(selectedExam.pyqPrice)}
                    onBuy={() => handlePayment('exam')}
                  />
                )}
                <DomainPicker
                  domains={domains}
                  purchasedPyqDomains={purchasedPyqDomains}
                  examUnlocked={examUnlocked}
                  hasActivePass={hasActivePass}
                  onPick={pickDomain}
                  onBuy={handleBuyDomainFromCard}
                />
              </>
            )}
            {step === 2 && (
              <>
                {/* Domain-level Buy banner (only shown if exam not already unlocked) */}
                {selectedDomain && !domainUnlocked && !hasActivePass && Number(selectedDomain.pyqPrice) > 0 && (
                  <BuyBanner
                    color="blue"
                    title={`Unlock all PYQs in ${selectedDomain.name}`}
                    subtitle={`Access every PYQ paper in this domain only.`}
                    amount={Number(selectedDomain.pyqPrice)}
                    onBuy={() => handlePayment('domain')}
                  />
                )}
                <TestList tests={tests} domain={selectedDomain} unlocked={domainUnlocked || hasActivePass} onStart={handleStartTest} onPdf={handlePdfAction} />
              </>
            )}
          </>
        )}
      </div>

      {/* Unlock Modal */}
      <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Unlock PYQs</DialogTitle>
            <DialogDescription>Choose how you want to access these previous year papers.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedDomain && Number(selectedDomain.pyqPrice) > 0 && (
              <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">This Domain (PYQ)</h4>
                    <p className="text-xs text-gray-600">{selectedDomain.name}</p>
                  </div>
                  <span className="text-xl font-bold text-blue-600">₹{Number(selectedDomain.pyqPrice)}</span>
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => handlePayment('domain')}>
                  Pay ₹{Number(selectedDomain.pyqPrice)} for Domain
                </Button>
              </div>
            )}
            {selectedExam && Number(selectedExam.pyqPrice) > 0 && (
              <div className="border-2 border-amber-400 rounded-lg p-4 bg-amber-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">Full Exam PYQ</h4>
                    <Badge className="bg-amber-200 text-amber-800 text-xs">Best Value</Badge>
                  </div>
                  <span className="text-xl font-bold text-amber-600">₹{Number(selectedExam.pyqPrice)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{selectedExam.name} — every PYQ in this exam.</p>
                <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => handlePayment('exam')}>
                  Pay ₹{Number(selectedExam.pyqPrice)} for Full Exam
                </Button>
              </div>
            )}
            <Link href="/get-pass" className="block">
              <div className="border-2 border-dashed border-brand-400 rounded-lg p-4 bg-gradient-to-r from-amber-50 via-white to-brand-50 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Get Pass — All Access</h4>
                    <p className="text-xs text-gray-600">One pass unlocks every Test Series, Domain and PYQ.</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">View</Badge>
                </div>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BuyBanner({ title, subtitle, amount, onBuy, color = 'amber' }) {
  const bg = color === 'blue' ? 'from-blue-50 to-white border-blue-200' : 'from-amber-50 to-white border-amber-200';
  const btn = color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700';
  return (
    <div className={`mb-6 p-5 rounded-xl border-2 bg-gradient-to-r ${bg} flex flex-wrap items-center gap-4`}>
      <Lock className={`w-6 h-6 ${color === 'blue' ? 'text-blue-600' : 'text-amber-600'}`} />
      <div className="flex-1 min-w-[240px]">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <Button className={btn} onClick={onBuy}>
        <ShieldCheck className="w-4 h-4 mr-2" /> Buy for ₹{Number(amount).toLocaleString('en-IN')}
      </Button>
    </div>
  );
}

function EmptyState({ icon, title, hint }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center text-gray-400">{icon}</div>
        <h3 className="font-bold text-gray-700">{title}</h3>
        {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ExamPicker({ exams, purchasedPyqExams, hasActivePass, onPick, onBuy }) {
  if (!exams || exams.length === 0) {
    return <EmptyState icon={<GraduationCap className="w-7 h-7" />} title="No exams available" hint="Please check back later." />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1 — Select an exam</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(e => {
          const unlocked = hasActivePass || purchasedPyqExams.has(e.id);
          const price = Number(e.pyqPrice || 0);
          return (
            <Card key={e.id} className="hover:shadow-lg transition border-2 hover:border-purple-300">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3 cursor-pointer" onClick={() => onPick(e)}>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0"><GraduationCap className="w-6 h-6" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{e.name}</h3>
                    {e.shortName && <p className="text-xs text-gray-500">{e.shortName}</p>}
                  </div>
                </div>

                {/* Price + Access row */}
                <div className="flex items-center justify-between mb-3 mt-3 pt-3 border-t border-gray-100">
                  {unlocked ? (
                    <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Unlocked</Badge>
                  ) : price > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Full PYQ Access</span>
                      <span className="text-2xl font-bold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Price not set</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onPick(e)}>
                    <ArrowRight className="w-4 h-4 mr-1" /> Browse
                  </Button>
                  {!unlocked && price > 0 && (
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white" onClick={() => onBuy(e)}>
                      <ShieldCheck className="w-4 h-4 mr-1" /> Purchase
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DomainPicker({ domains, purchasedPyqDomains, examUnlocked, hasActivePass, onPick, onBuy }) {
  if (!domains || domains.length === 0) {
    return <EmptyState icon={<Layers className="w-7 h-7" />} title="No domains for this exam" hint="Pick another exam or check back later." />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2 — Select a domain</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(d => {
          const unlocked = examUnlocked || hasActivePass || purchasedPyqDomains.has(d.id);
          const price = Number(d.pyqPrice || 0);
          return (
            <Card key={d.id} className="hover:shadow-lg transition border-2 hover:border-purple-300">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3 cursor-pointer" onClick={() => onPick(d)}>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0"><Layers className="w-6 h-6" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{d.name}</h3>
                    {d.description && <p className="text-xs text-gray-500 truncate mt-0.5">{d.description}</p>}
                  </div>
                </div>

                {/* Price + Access row */}
                <div className="flex items-center justify-between mb-3 mt-3 pt-3 border-t border-gray-100">
                  {unlocked ? (
                    <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Unlocked</Badge>
                  ) : price > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Domain PYQ Access</span>
                      <span className="text-2xl font-bold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Price not set</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onPick(d)}>
                    <ArrowRight className="w-4 h-4 mr-1" /> Browse
                  </Button>
                  {!unlocked && price > 0 && (
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white" onClick={() => onBuy(d)}>
                      <ShieldCheck className="w-4 h-4 mr-1" /> Purchase
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TestList({ tests, domain, unlocked, onStart, onPdf }) {
  if (!tests || tests.length === 0) {
    return <EmptyState icon={<FileText className="w-7 h-7" />} title="No tests available" hint={`No published previous-year tests under ${domain?.name || 'this domain'} yet.`} />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 3 — Pick a test to start</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(t => {
          const free = t.isFree;
          const canStart = free || unlocked;
          const hasPdf = !!t.pdfFileId;
          const canDownload = t.pdfPermission === 'view_download';
          return (
            <Card key={t.id} className="hover:shadow-lg transition">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{t.title}</h3>
                    {t.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{t.description}</p>}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {t.questionCount || 0} questions</span>
                      {t.duration ? <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.duration} min</span> : null}
                      {free ? <Badge className="bg-green-500">Free</Badge> : unlocked ? <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Unlocked</Badge> : <Badge className="bg-gray-500"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>}
                      {hasPdf && (
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          {canDownload ? (<><Download className="w-3 h-3 mr-1" /> PDF · Download</>) : (<><Eye className="w-3 h-3 mr-1" /> PDF · View</>)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {hasPdf ? (
                  <div className="mt-4 flex items-stretch rounded-md overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => onPdf(t)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 px-4 py-2.5 text-sm font-medium transition"
                      title={canDownload ? 'Download original question paper PDF' : 'View original question paper PDF'}
                    >
                      {canDownload ? <Download className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{canDownload ? 'Download PDF' : 'View PDF'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onStart(t)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition ${canStart ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                    >
                      {canStart ? <><BookOpen className="w-4 h-4" /> Start Test</> : <><Lock className="w-4 h-4" /> Unlock to start</>}
                    </button>
                  </div>
                ) : (
                  <Button onClick={() => onStart(t)} className={`w-full mt-4 ${canStart ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-gray-600'}`}>
                    {canStart ? <><BookOpen className="w-4 h-4 mr-2" /> Start with Solutions</> : <><Lock className="w-4 h-4 mr-2" /> Unlock to start</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
