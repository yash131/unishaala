'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Lock,
  Eye,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  LogIn,
  Phone,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * BlogPdfViewer
 * Props:
 *  - blog: { pdfFileId, pdfPreviewFileId, pdfFileName, pdfPageCount, pdfSize, pdfPermission }
 *
 * Behavior:
 *  - Always fetches /api/auth/me to determine login + phone verification state.
 *  - If user is NOT logged in OR NOT phone-verified → show preview PDF (page 1 only) + locked overlay + CTA.
 *  - If user IS logged in AND phone-verified → show full PDF via iframe.
 *      - If pdfPermission === 'view_download' → show Download button.
 *      - If pdfPermission === 'view' → hide Download; note "Download disabled by admin".
 */
export default function BlogPdfViewer({ blog }) {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setMe(d.data);
        else setMe(null);
      } else {
        setMe(null);
      }
    } catch (_e) {
      setMe(null);
    } finally {
      setLoadingMe(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  if (!blog || !blog.pdfFileId || !blog.pdfPreviewFileId) return null;

  const isLoggedIn = !!me?.id;
  const isPhoneVerified = !!me?.phoneVerified;
  const canViewFull = isLoggedIn && isPhoneVerified;
  const canDownload = canViewFull && blog.pdfPermission === 'view_download';

  const showingFull = canViewFull && unlocked;

  // Build src
  const previewSrc = `/api/pdfs/${blog.pdfPreviewFileId}/preview#toolbar=0&navpanes=0`;
  const fullSrc = `/api/pdfs/${blog.pdfFileId}/full#toolbar=${canDownload ? '1' : '0'}&navpanes=0`;
  const viewerSrc = showingFull ? fullSrc : previewSrc;

  const handleDownload = async () => {
    if (!canDownload) {
      toast.error('Download not allowed for this document');
      return;
    }
    try {
      const res = await fetch(`/api/pdfs/${blog.pdfFileId}/download`, { credentials: 'include' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        toast.error('Unable to download: ' + (txt || res.statusText));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = blog.pdfFileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e) {
      toast.error('Download failed');
    }
  };

  return (
    <div className="mt-10 border-t pt-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center shadow">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {blog.pdfFileName || 'Attached Document'}
            </h3>
            <p className="text-xs text-gray-500">
              {blog.pdfPageCount ? `${blog.pdfPageCount} page${blog.pdfPageCount === 1 ? '' : 's'}` : 'PDF'}
              {blog.pdfSize ? ` • ${(blog.pdfSize / 1024 / 1024).toFixed(2)} MB` : ''}
              {blog.pdfPermission === 'view_download' ? (
                <span className="ml-2 text-green-700">• Download allowed</span>
              ) : (
                <span className="ml-2 text-amber-700">• View only</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canDownload && showingFull && (
            <Button onClick={handleDownload} className="bg-pink-600 hover:bg-pink-700">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Viewer */}
      <div className="relative rounded-xl overflow-hidden border shadow-lg bg-gray-100">
        {loadingMe ? (
          <div className="h-[500px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
          </div>
        ) : (
          <iframe
            key={viewerSrc}
            src={viewerSrc}
            title={blog.pdfFileName || 'Blog PDF'}
            className="w-full h-[600px] bg-white"
            // Disallow downloads through viewer controls when not permitted:
            // (browsers still honor the header-based download; this is best-effort UX)
          />
        )}

        {/* Overlay: Unlock full PDF */}
        {!loadingMe && !showingFull && (
          <div className="absolute inset-0 flex items-end md:items-center justify-center bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none">
            <div className="bg-white shadow-2xl rounded-xl p-5 md:p-6 mx-3 mb-4 md:mb-0 max-w-md w-full border pointer-events-auto">
              {!isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-gray-900">Unlock the full document</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    You&apos;re viewing page 1 only. Log in and verify your phone number to read the full PDF.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/login" className="flex-1">
                      <Button className="w-full bg-pink-600 hover:bg-pink-700">
                        <LogIn className="w-4 h-4 mr-2" /> Log in
                      </Button>
                    </Link>
                    <Link href="/signup" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Sparkles className="w-4 h-4 mr-2" /> Create account
                      </Button>
                    </Link>
                  </div>
                </>
              ) : !isPhoneVerified ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-gray-900">Verify your phone to continue</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    For secure access, please verify your phone number (one time). It takes under a minute.
                  </p>
                  <Button
                    onClick={() => setShowVerifyModal(true)}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" /> Verify phone number
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-gray-900">Access granted</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Click below to load the full document.
                  </p>
                  <Button
                    onClick={() => setUnlocked(true)}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    <Eye className="w-4 h-4 mr-2" /> View full PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5" />
        Secured document. {canDownload ? 'Download enabled by admin.' : 'Downloads are disabled for this document.'}
      </p>

      {/* Phone verification modal */}
      <PhoneVerifyModal
        open={showVerifyModal}
        onOpenChange={setShowVerifyModal}
        user={me}
        onVerified={async () => {
          await refreshMe();
          setUnlocked(true);
          setShowVerifyModal(false);
        }}
      />
    </div>
  );
}

function PhoneVerifyModal({ open, onOpenChange, user, onVerified }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // phone | code
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(user?.phone || '');
      setCode('');
      setStep('phone');
    }
  }, [open, user]);

  const sendOtp = async () => {
    if (!phone || phone.trim().length < 8) {
      toast.error('Enter a valid phone number with country code, e.g. +91XXXXXXXXXX');
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
    } catch (e) {
      toast.error('Failed to send OTP');
    }
    setSending(false);
  };

  const verifyOtp = async () => {
    if (!code || code.trim().length < 4) {
      toast.error('Enter the 6-digit code');
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
        toast.success('Phone verified!');
        // Update localStorage cached user if present
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored) {
            stored.phoneVerified = true;
            stored.phone = phone.trim();
            localStorage.setItem('user', JSON.stringify(stored));
            window.dispatchEvent(new Event('userChanged'));
          }
        } catch (_e) {}
        onVerified?.();
      } else {
        toast.error(d.error || 'Invalid OTP');
      }
    } catch (e) {
      toast.error('Verification failed');
    }
    setVerifying(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-pink-600" />
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
                className="text-xs text-pink-600 hover:underline"
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
              <Button onClick={sendOtp} disabled={sending} className="bg-pink-600 hover:bg-pink-700">
                {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('phone')} disabled={verifying}>
                Back
              </Button>
              <Button onClick={verifyOtp} disabled={verifying} className="bg-pink-600 hover:bg-pink-700">
                {verifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : 'Verify & unlock'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
