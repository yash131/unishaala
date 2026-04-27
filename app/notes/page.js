'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  GraduationCap, ArrowLeft, ArrowRight, Loader2, BookOpen, Layers,
  FileText, ChevronRight, CheckCircle, Download, Eye, Lock, ShieldCheck, X
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Exam', 'Domain', 'Subject', 'Notes'];

export default function NotesPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState([]);
  const [domains, setDomains] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewer, setViewer] = useState(null); // note being viewed inline

  // Step 1: load exams
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
  }, []);

  const pickExam = async (exam) => {
    setSelectedExam(exam);
    setSelectedDomain(null);
    setSelectedSubject(null);
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
    setSelectedSubject(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/notes-subjects?examId=${selectedExam.id}&domainId=${domain.id}`);
      const d = await r.json();
      if (d.success) setSubjects(d.data || []);
    } catch (_e) { toast.error('Failed to load subjects'); }
    setLoading(false);
    setStep(2);
  };

  const pickSubject = async (subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    try {
      const r = await fetch(`/api/notes?examId=${selectedExam.id}&domainId=${selectedDomain.id}&subjectId=${subject.id}`);
      const d = await r.json();
      if (d.success) setNotes(d.data || []);
    } catch (_e) { toast.error('Failed to load notes'); }
    setLoading(false);
    setStep(3);
  };

  const goBack = () => {
    if (step === 0) { router.push('/'); return; }
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 via-white to-white">
      {/* Top nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand-600" /> Premium Notes
          </h1>
          <p className="text-gray-600 mt-2">Concept-focused, exam-oriented notes. Select an exam, domain and subject to browse available notes.</p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                idx < step ? 'bg-green-50 border-green-300 text-green-700' :
                idx === step ? 'bg-brand-50 border-brand-400 text-brand-700' :
                'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < step ? 'bg-green-500 text-white' :
                  idx === step ? 'bg-brand-600 text-white' :
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

        {/* Breadcrumb of selections */}
        {step > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            {selectedExam && <Badge variant="outline" className="px-3 py-1">{selectedExam.name}</Badge>}
            {selectedDomain && <><ChevronRight className="w-3 h-3 text-gray-400" /><Badge variant="outline" className="px-3 py-1">{selectedDomain.name}</Badge></>}
            {selectedSubject && <><ChevronRight className="w-3 h-3 text-gray-400" /><Badge variant="outline" className="px-3 py-1 bg-brand-50 border-brand-200 text-brand-700">{selectedSubject.name}</Badge></>}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={goBack}><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
          </div>
        )}

        {/* Steps content */}
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <>
            {step === 0 && <ExamPicker exams={exams} onPick={pickExam} />}
            {step === 1 && <DomainPicker domains={domains} onPick={pickDomain} />}
            {step === 2 && <SubjectPicker subjects={subjects} onPick={pickSubject} />}
            {step === 3 && <NotesList notes={notes} subject={selectedSubject} onView={setViewer} />}
          </>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewer && <PdfViewerModal note={viewer} onClose={() => setViewer(null)} />}
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

function ExamPicker({ exams, onPick }) {
  if (!exams || exams.length === 0) {
    return <EmptyState icon={<GraduationCap className="w-7 h-7" />} title="No exams available" hint="Please check back later." />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1 — Select an exam</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(e => (
          <Card key={e.id} className="hover:ring-2 hover:ring-brand-300 cursor-pointer transition" onClick={() => onPick(e)}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{e.name}</h3>
                {e.shortName && <p className="text-xs text-gray-500">{e.shortName}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DomainPicker({ domains, onPick }) {
  if (!domains || domains.length === 0) {
    return <EmptyState icon={<Layers className="w-7 h-7" />} title="No domains for this exam" hint="Pick another exam or check back later." />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2 — Select a domain</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(d => (
          <Card key={d.id} className="hover:ring-2 hover:ring-brand-300 cursor-pointer transition" onClick={() => onPick(d)}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><Layers className="w-6 h-6" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{d.name}</h3>
                {d.description && <p className="text-xs text-gray-500 truncate">{d.description}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SubjectPicker({ subjects, onPick }) {
  if (!subjects || subjects.length === 0) {
    return <EmptyState icon={<BookOpen className="w-7 h-7" />} title="No subjects with notes yet" hint="Please check back later or pick another domain." />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 3 — Select a subject</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(s => {
          const count = s.noteCount || 0;
          const disabled = count === 0;
          return (
            <Card key={s.id} className={`transition ${disabled ? 'opacity-60' : 'hover:ring-2 hover:ring-brand-300 cursor-pointer'}`}
                  onClick={() => !disabled && onPick(s)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                  <p className="text-xs text-gray-500">
                    {count} note{count === 1 ? '' : 's'} available
                  </p>
                </div>
                {!disabled && <ArrowRight className="w-4 h-4 text-gray-400" />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NotesList({ notes, subject, onView }) {
  if (!notes || notes.length === 0) {
    return <EmptyState icon={<FileText className="w-7 h-7" />} title="No notes available" hint={`No notes have been uploaded for ${subject?.name || 'this subject'} yet.`} />;
  }

  const handleDownload = async (note) => {
    if (note.pdfPermission !== 'view_download') {
      toast.error('Download not allowed for this note');
      return;
    }
    try {
      const res = await fetch(`/api/pdfs/${note.pdfFileId}/download`, { credentials: 'include' });
      if (!res.ok) {
        toast.error('Unable to download');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.pdfFileName || `${note.title}.pdf`;
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
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 4 — Pick a note to read or download</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(n => {
          const canDownload = n.pdfPermission === 'view_download';
          return (
            <Card key={n.id} className="hover:shadow-lg transition">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{n.title}</h3>
                    {n.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{n.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {n.pdfFileName && <span className="truncate">{n.pdfFileName}</span>}
                      {n.pdfPageCount ? <span>• {n.pdfPageCount} page{n.pdfPageCount === 1 ? '' : 's'}</span> : null}
                      {n.pdfSize ? <span>• {(n.pdfSize / 1024 / 1024).toFixed(2)} MB</span> : null}
                      {canDownload ? (
                        <Badge className="bg-green-500">Download allowed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">View only</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => onView(n)} className="flex-1 bg-brand-600 hover:bg-brand-700">
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  {canDownload ? (
                    <Button variant="outline" onClick={() => handleDownload(n)}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  ) : (
                    <Button variant="outline" disabled title="Download disabled by admin">
                      <Lock className="w-4 h-4 mr-2" /> No download
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

function PdfViewerModal({ note, onClose }) {
  const canDownload = note.pdfPermission === 'view_download';
  const src = `/api/pdfs/${note.pdfFileId}/full#toolbar=${canDownload ? '1' : '0'}&navpanes=0`;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 md:p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{note.title}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secured document
                {canDownload ? <span className="text-green-700"> • download enabled</span> : <span className="text-amber-700"> • view only</span>}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <div className="flex-1 bg-gray-100">
          <iframe key={src} src={src} title={note.title} className="w-full h-full bg-white" />
        </div>
      </div>
    </div>
  );
}
