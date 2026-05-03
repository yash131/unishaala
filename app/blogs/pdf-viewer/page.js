'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { MainNavbar } from '@/components/MainNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Eye, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PdfViewerContent() {
  const searchParams = useSearchParams();
  const pdfId = searchParams.get('pdfId') || '';
  const rawUrl = searchParams.get('url') || '';
  const qsLabel = searchParams.get('label') || '';

  const [resolved, setResolved] = useState({ url: '', label: '', fileName: '', status: 'loading' });
  // status: loading | ready | missing | invalid

  const [viewMode, setViewMode] = useState('loading'); // loading | iframe | gdocs | fallback
  const [iframeKey] = useState(0);

  // Resolve PDF: either from library (pdfId) or direct URL
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (pdfId) {
        try {
          const res = await fetch(`/api/blog-pdfs/${pdfId}`, { credentials: 'include' });
          const d = await res.json();
          if (!cancelled) {
            if (d.success) {
              setResolved({
                url: d.data.fileUrl,
                label: qsLabel || d.data.label || 'PDF Document',
                fileName: d.data.fileName || 'document.pdf',
                status: 'ready',
              });
            } else {
              setResolved({ url: '', label: qsLabel || 'PDF', fileName: '', status: 'missing' });
            }
          }
        } catch (_e) {
          if (!cancelled) setResolved({ url: '', label: qsLabel || 'PDF', fileName: '', status: 'missing' });
        }
      } else if (rawUrl) {
        setResolved({
          url: rawUrl,
          label: qsLabel || 'PDF Document',
          fileName: decodeURIComponent(rawUrl.split('/').pop().split('?')[0]) || 'document.pdf',
          status: 'ready',
        });
      } else {
        setResolved({ url: '', label: '', fileName: '', status: 'invalid' });
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [pdfId, rawUrl, qsLabel]);

  // Determine viewer mode once we have a URL
  useEffect(() => {
    if (resolved.status !== 'ready' || !resolved.url) return;
    const isInternal = resolved.url.startsWith('/') || (typeof window !== 'undefined' && resolved.url.startsWith(window.location.origin));
    setViewMode(isInternal ? 'iframe' : 'gdocs');
  }, [resolved.status, resolved.url]);

  const handleDownload = useCallback(() => {
    if (!resolved.url) return;
    const a = document.createElement('a');
    a.href = resolved.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('download', resolved.fileName || 'document.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resolved.url, resolved.fileName]);

  const handleIframeError = useCallback(() => {
    if (viewMode === 'iframe') setViewMode('gdocs');
    else if (viewMode === 'gdocs') setViewMode('fallback');
  }, [viewMode]);

  // --- Loading ---
  if (resolved.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-brand-50/30">
        <MainNavbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-brand-600 mb-4" />
          <p className="text-sm text-gray-500">Loading PDF…</p>
        </div>
      </div>
    );
  }

  // --- Missing (library item deleted) ---
  if (resolved.status === 'missing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
        <MainNavbar />
        <div className="container mx-auto px-4 pt-32 max-w-lg">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">PDF no longer available</h1>
              <p className="text-sm text-gray-500 mb-6">
                This PDF has been removed by the administrator and is no longer available for viewing or download.
              </p>
              <Button onClick={() => window.history.back()} variant="outline" className="mr-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
              <Link href="/blogs">
                <Button className="bg-brand-600 hover:bg-brand-700">Browse Blogs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Invalid / no params ---
  if (resolved.status === 'invalid' || !resolved.url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
        <MainNavbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No PDF specified</h1>
          <p className="text-gray-500 mb-6">The PDF link is missing or invalid.</p>
          <Link href="/blogs">
            <Button className="bg-brand-600 hover:bg-brand-700">Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Ready ---
  const pdfUrl = resolved.url;
  const label = resolved.label;
  const fileName = resolved.fileName;
  const gDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    typeof window !== 'undefined' && pdfUrl.startsWith('/') ? window.location.origin + pdfUrl : pdfUrl
  )}&embedded=true`;
  const viewerSrc = viewMode === 'gdocs' ? gDocsUrl : pdfUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-brand-50/30">
      <MainNavbar />

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Top bar */}
          <div className="max-w-5xl mx-auto mb-4">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-gray-600 hover:text-brand-600 transition-colors text-sm font-medium mb-3"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </button>

            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{label}</h1>
                      <p className="text-xs text-gray-400 truncate">{fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      onClick={handleDownload}
                      className="bg-brand-600 hover:bg-brand-700 text-white flex-1 sm:flex-none"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Now
                    </Button>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" title="Open in new tab">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Viewer */}
          <div className="max-w-5xl mx-auto">
            <Card className="border-0 shadow-xl bg-white overflow-hidden">
              <CardContent className="p-0">
                {viewMode === 'loading' && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent mb-4"></div>
                    <p className="text-sm text-gray-500">Loading PDF...</p>
                  </div>
                )}

                {viewMode === 'fallback' ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to preview PDF</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-md">
                      The PDF cannot be displayed inline. Click below to open or download it directly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-brand-600 hover:bg-brand-700">
                          <Eye className="w-4 h-4 mr-2" /> Open PDF
                        </Button>
                      </a>
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> Download Now
                      </Button>
                    </div>
                  </div>
                ) : (viewMode === 'iframe' || viewMode === 'gdocs') ? (
                  <iframe
                    key={iframeKey}
                    src={viewerSrc}
                    className="w-full border-0"
                    style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
                    title="PDF Viewer"
                    onError={handleIframeError}
                    allow="autoplay"
                  />
                ) : null}
              </CardContent>
            </Card>

            {/* Bottom download bar (mobile-friendly) */}
            <div className="mt-4 text-center sm:hidden">
              <Button
                onClick={handleDownload}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" /> Download Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PdfViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-brand-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    }>
      <PdfViewerContent />
    </Suspense>
  );
}
