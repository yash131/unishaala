'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  Users,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  BookOpen,
  FileText,
  Download,
  Lock,
  Eye,
  Loader2,
  ShieldCheck,
  LogIn,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="default" showText={false} />
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-brand-600 text-brand-600">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-brand-500 hover:bg-brand-600">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setJob(result.data);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          setMe(d.success ? d.data : null);
        } else {
          setMe(null);
        }
      } catch (_e) {
        setMe(null);
      } finally {
        setMeLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Link href="/jobs" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-10 h-10 text-brand-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-brand-600 font-medium mb-4">{job.organization}</p>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {job.vacancies} Vacancies
                </span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" /> {job.salary}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Badge className="bg-green-100 text-green-700 text-sm px-4 py-2">
                Active
              </Badge>
              <Badge className="bg-brand-100 text-brand-700 text-sm px-4 py-2">
                Last Date: {job.lastDate}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{job.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="text-sm text-gray-500">Qualification</p>
                      <p className="font-medium">{job.qualification}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <IndianRupee className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="text-sm text-gray-500">Salary Range</p>
                      <p className="font-medium">{job.salary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="text-sm text-gray-500">Total Vacancies</p>
                      <p className="font-medium">{job.vacancies}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Criteria</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">{job.qualification}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">Age limit as per government norms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">Indian citizenship required</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {job.pdfFileId && job.pdfPreviewFileId && (
              <Card>
                <CardContent className="p-6">
                  <JobPdfSection job={job} me={me} meLoading={meLoading} />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Know More</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Application Deadline</span>
                    <span className="font-medium text-brand-600">{job.lastDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Application Fee</span>
                    <span className="font-medium">Varies by category</span>
                  </div>
                </div>
                <Button className="w-full bg-brand-500 hover:bg-brand-600 text-lg py-6">
                  Know More <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  You will be redirected to official website
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobPdfSection({ job, me, meLoading }) {
  const [unlocked, setUnlocked] = useState(false);
  const isLoggedIn = !!me?.id;
  const canViewFull = isLoggedIn;
  const canDownload = canViewFull && job.pdfPermission === 'view_download';
  const showingFull = canViewFull && unlocked;

  const previewSrc = `/api/pdfs/${job.pdfPreviewFileId}/preview#toolbar=0&navpanes=0`;
  const fullSrc = `/api/pdfs/${job.pdfFileId}/full#toolbar=${canDownload ? '1' : '0'}&navpanes=0`;
  const viewerSrc = showingFull ? fullSrc : previewSrc;

  const handleDownload = async () => {
    if (!canDownload) {
      toast.error('Download not allowed for this document');
      return;
    }
    try {
      const res = await fetch(`/api/pdfs/${job.pdfFileId}/download`, { credentials: 'include' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        toast.error('Unable to download: ' + (txt || res.statusText));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = job.pdfFileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (_e) {
      toast.error('Download failed');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center shadow">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {job.pdfFileName || 'Job Notification PDF'}
            </h3>
            <p className="text-xs text-gray-500">
              {job.pdfPageCount ? `${job.pdfPageCount} page${job.pdfPageCount === 1 ? '' : 's'}` : 'PDF'}
              {job.pdfSize ? ` \u2022 ${(job.pdfSize / 1024 / 1024).toFixed(2)} MB` : ''}
              {job.pdfPermission === 'view_download' ? (
                <span className="ml-2 text-green-700">• Download allowed</span>
              ) : (
                <span className="ml-2 text-amber-700">• View only</span>
              )}
            </p>
          </div>
        </div>
        {canDownload && showingFull && (
          <Button onClick={handleDownload} className="bg-brand-600 hover:bg-brand-700">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden border shadow-lg bg-gray-100">
        {meLoading ? (
          <div className="h-[500px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <iframe
            key={viewerSrc}
            src={viewerSrc}
            title={job.pdfFileName || 'Job PDF'}
            className="w-full h-[600px] bg-white"
          />
        )}

        {!meLoading && !showingFull && (
          <div className="absolute inset-0 flex items-end md:items-center justify-center bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none">
            <div className="bg-white shadow-2xl rounded-xl p-5 md:p-6 mx-3 mb-4 md:mb-0 max-w-md w-full border pointer-events-auto">
              {!isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-gray-900">Unlock the full document</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    You&apos;re viewing page 1 only. Log in to read the full notification PDF.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href={`/login?next=/jobs/${job.id}`} className="flex-1">
                      <Button className="w-full bg-brand-600 hover:bg-brand-700">
                        <LogIn className="w-4 h-4 mr-2" /> Log in
                      </Button>
                    </Link>
                    <Link href={`/signup?next=/jobs/${job.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Sparkles className="w-4 h-4 mr-2" /> Create account
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-gray-900">Access granted</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Click below to load the full document.
                  </p>
                  <Button
                    onClick={() => setUnlocked(true)}
                    className="w-full bg-brand-600 hover:bg-brand-700"
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
    </div>
  );
}

