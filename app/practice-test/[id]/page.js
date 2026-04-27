'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  ArrowLeft, ArrowRight, Loader2, BookOpen, Eye, CheckCircle, XCircle,
  Lightbulb, ChevronLeft, ChevronRight, FileText, Trophy, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

function renderText(text) {
  if (!text) return null;
  return <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: text }} />;
}

export default function PracticeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id;

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  // selections: { [questionId]: 'A' | 'B' | ... }
  const [selections, setSelections] = useState({});
  // revealed: { [questionId]: true }
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/practice-test-questions/${testId}`, { cache: 'no-store' });
        const d = await r.json();
        if (d.success) {
          setTest(d.data.test);
          setQuestions(d.data.questions || []);
        } else {
          toast.error(d.error || 'Failed to load test');
        }
      } catch (_e) {
        toast.error('Failed to load test');
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <FileText className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-700">No questions in this practice test</h2>
        <Link href="/practice"><Button className="mt-4 bg-brand-600 hover:bg-brand-700">Back to Practice</Button></Link>
      </div>
    );
  }

  const q = questions[idx];
  const selected = selections[q.id];
  const isRevealed = !!revealed[q.id];
  const correctLetter = (q.correctOption || '').toUpperCase();
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const totalAnswered = Object.keys(selections).length;
  const totalCorrect = questions.filter(qq => (selections[qq.id] || '') === (qq.correctOption || '').toUpperCase()).length;

  const select = (letter) => {
    if (isRevealed) return; // lock after reveal
    setSelections(prev => ({ ...prev, [q.id]: letter }));
  };

  const reveal = () => {
    if (!selected) return;
    setRevealed(prev => ({ ...prev, [q.id]: true }));
  };

  const goPrev = () => setIdx(i => Math.max(0, i - 1));
  const goNext = () => setIdx(i => Math.min(questions.length - 1, i + 1));

  const reset = () => {
    if (!confirm('Reset all answers and start over?')) return;
    setSelections({});
    setRevealed({});
    setIdx(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 via-white to-white">
      {/* Top nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <span className="text-gray-300 hidden md:inline">|</span>
            <h1 className="font-bold text-gray-900 truncate hidden md:block">{test.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />
              {totalCorrect} correct
            </Badge>
            <Badge variant="outline" className="hidden sm:flex">
              {totalAnswered}/{questions.length} answered
            </Badge>
            <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
            <Link href="/practice"><Button size="sm" variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Exit</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main */}
        <div>
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-brand-600">Question {idx + 1} of {questions.length}</Badge>
                  {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                </div>
                <span className="text-sm text-gray-500">{q.marks ?? 2} mark{(q.marks ?? 2) === 1 ? '' : 's'}</span>
              </div>

              <div className="mb-4">
                {q.questionText && renderText(q.questionText)}
                {q.question_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.question_image_url} alt={`Question ${idx + 1}`} className="mt-3 max-w-full rounded border" />
                )}
              </div>

              <div className="space-y-2">
                {q.options && q.options.map((opt, i) => {
                  const letter = optionLetters[i];
                  const isSelected = selected === letter;
                  const isCorrect = isRevealed && letter === correctLetter;
                  const isWrongPick = isRevealed && isSelected && letter !== correctLetter;
                  return (
                    <button
                      key={i}
                      onClick={() => select(letter)}
                      disabled={isRevealed}
                      className={`w-full text-left p-4 rounded-lg border-2 transition flex items-start gap-3 ${
                        isCorrect ? 'border-green-500 bg-green-50' :
                        isWrongPick ? 'border-red-500 bg-red-50' :
                        isSelected ? 'border-brand-500 bg-brand-50' :
                        'border-gray-200 hover:border-brand-300 hover:bg-brand-50/30'
                      } ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full font-bold flex items-center justify-center ${
                        isCorrect ? 'bg-green-500 text-white' :
                        isWrongPick ? 'bg-red-500 text-white' :
                        isSelected ? 'bg-brand-600 text-white' :
                        'bg-gray-100 text-gray-700'
                      }`}>{letter}</span>
                      <div className="flex-1 min-w-0">
                        {opt && <div className="text-gray-800">{opt}</div>}
                        {q.optionImages && q.optionImages[i] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.optionImages[i]} alt={`Option ${letter}`} className="mt-2 max-h-40 rounded border" />
                        )}
                      </div>
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isWrongPick && <XCircle className="w-5 h-5 text-red-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Action: View Solution */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  onClick={reveal}
                  disabled={!selected || isRevealed}
                  className={`${selected && !isRevealed ? 'bg-brand-600 hover:bg-brand-700' : ''}`}
                  variant={selected && !isRevealed ? 'default' : 'outline'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isRevealed ? 'Solution Shown' : 'View Solution'}
                </Button>
                {!selected && !isRevealed && (
                  <span className="text-xs text-gray-500">Select an option to enable</span>
                )}
              </div>

              {/* Solution panel */}
              {isRevealed && (
                <div className="mt-6 border-2 border-amber-200 bg-amber-50 rounded-lg p-5">
                  <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5" /> Solution
                  </h4>
                  <div className="text-sm text-gray-800 mb-3">
                    <strong>Correct answer:</strong>{' '}
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white font-bold">{correctLetter || '?'}</span>
                  </div>
                  {q.solution && (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.solution }} />
                  )}
                  {q.solution_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.solution_image_url} alt="Solution" className="mt-3 max-w-full rounded border" />
                  )}
                  {!q.solution && !q.solution_image_url && (
                    <p className="text-sm text-gray-500 italic">No detailed explanation provided.</p>
                  )}
                </div>
              )}

              {/* Nav */}
              <div className="mt-6 flex items-center justify-between">
                <Button variant="outline" onClick={goPrev} disabled={idx === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-gray-500">{idx + 1} / {questions.length}</span>
                <Button onClick={goNext} disabled={idx === questions.length - 1} className="bg-brand-600 hover:bg-brand-700">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Question palette */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-brand-600" /> Progress</h3>
              <div className="text-sm text-gray-600 mb-3">
                <div className="flex justify-between"><span>Answered</span><span className="font-medium">{totalAnswered}/{questions.length}</span></div>
                <div className="flex justify-between text-green-700"><span>Correct</span><span className="font-medium">{totalCorrect}</span></div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((qq, i) => {
                  const sel = selections[qq.id];
                  const seen = !!revealed[qq.id];
                  const isRight = seen && sel === (qq.correctOption || '').toUpperCase();
                  const isWrong = seen && sel && !isRight;
                  return (
                    <button
                      key={qq.id}
                      onClick={() => setIdx(i)}
                      className={`aspect-square rounded text-xs font-bold border-2 flex items-center justify-center ${
                        i === idx ? 'ring-2 ring-brand-500 ' : ''
                      } ${
                        isRight ? 'bg-green-100 border-green-500 text-green-800' :
                        isWrong ? 'bg-red-100 border-red-500 text-red-800' :
                        sel ? 'bg-brand-50 border-brand-300 text-brand-700' :
                        'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-xs text-gray-600">
              <p className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded bg-brand-50 border-2 border-brand-300" /> Selected</p>
              <p className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded bg-green-100 border-2 border-green-500" /> Correct</p>
              <p className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded bg-red-100 border-2 border-red-500" /> Wrong</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-50 border-2 border-gray-200" /> Unanswered</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
