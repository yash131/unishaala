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
  Target, FileText, Clock, ChevronRight, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Exam', 'Domain', 'Subject', 'Tests'];

export default function PracticePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState([]);
  const [domains, setDomains] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

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
        // The exam-by-slug endpoint typically returns { exam, domains }
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
      const r = await fetch(`/api/subjects?examId=${selectedExam.id}&domainId=${domain.id}`);
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
      const r = await fetch(`/api/practice-tests?subjectId=${subject.id}`);
      const d = await r.json();
      if (d.success) setTests(d.data || []);
    } catch (_e) { toast.error('Failed to load tests'); }
    setLoading(false);
    setStep(3);
  };

  const goBack = () => {
    if (step === 0) {
      router.push('/');
      return;
    }
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 via-white to-white">
      {/* Top nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand-600" /> Practice Questions
          </h1>
          <p className="text-gray-600 mt-2">Sharpen your concepts with topic-wise practice questions. Pick an exam, domain and subject to get started.</p>
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
            {step === 3 && <TestList tests={tests} subject={selectedSubject} />}
          </>
        )}
      </div>
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
  const available = subjects.filter(s => (s.testCount || 0) > 0);
  if (!subjects || subjects.length === 0) {
    return <EmptyState icon={<BookOpen className="w-7 h-7" />} title="No subjects available" hint="Please check back later or pick another domain." />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 3 — Select a subject</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(s => {
          const count = s.testCount || 0;
          const disabled = count === 0;
          return (
            <Card key={s.id} className={`transition ${disabled ? 'opacity-60' : 'hover:ring-2 hover:ring-brand-300 cursor-pointer'}`}
                  onClick={() => !disabled && onPick(s)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                  <p className="text-xs text-gray-500">
                    {count} test{count === 1 ? '' : 's'} available
                  </p>
                </div>
                {!disabled && <ArrowRight className="w-4 h-4 text-gray-400" />}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {available.length === 0 && (
        <p className="text-xs text-amber-600 mt-3">No published practice tests yet under any of these subjects.</p>
      )}
    </div>
  );
}

function TestList({ tests, subject }) {
  if (!tests || tests.length === 0) {
    return <EmptyState icon={<FileText className="w-7 h-7" />} title="No tests available" hint={`No published practice tests found for ${subject?.name || 'this subject'} yet.`} />;
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Step 4 — Pick a test to start</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(t => (
          <Card key={t.id} className="hover:shadow-lg transition">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{t.title}</h3>
                  {t.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{t.description}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {t.questionCount || 0} questions</span>
                    {t.duration ? <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.duration} min</span> : null}
                    {t.isFree ? <Badge className="bg-green-500">Free</Badge> : <Badge className="bg-brand-600">₹{t.price || 0}</Badge>}
                  </div>
                </div>
              </div>
              <Link href={`/practice-test/${t.id}`}>
                <Button className="w-full mt-4 bg-brand-600 hover:bg-brand-700">
                  <BookOpen className="w-4 h-4 mr-2" /> Start Practice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
