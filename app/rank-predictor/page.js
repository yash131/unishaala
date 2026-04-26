'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MainNavbar } from '@/components/MainNavbar';
import {
  Target, TrendingUp, Loader2, Upload, Link as LinkIcon, CheckCircle,
  XCircle, MinusCircle, Trophy, Users, Percent, ListChecks, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'PwD'];

// -------- Response Sheet Flow ---------
function ResponseSheetPredictor() {
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    answerKeyId: '', name: '', email: '', phone: '', category: 'General'
  });
  const [responseMode, setResponseMode] = useState('url'); // url | upload | manual
  const [responseUrl, setResponseUrl] = useState('');
  const [responseHtml, setResponseHtml] = useState('');
  const [manualText, setManualText] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/answer-keys');
        const d = await res.json();
        if (d.success) setKeys(d.data || []);
      } catch (e) { /* ignore */ } finally { setLoadingKeys(false); }
    })();
    // Auto-fill from logged-in user
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u) setForm(f => ({ ...f, name: u.name || '', email: u.email || '', phone: u.phone || '' }));
    } catch (e) {}
  }, []);

  const selectedKey = keys.find(k => k.id === form.answerKeyId);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setResponseHtml(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const validate = () => {
    if (!form.answerKeyId) { toast.error('Please select an answer key'); return false; }
    if (!form.name.trim()) { toast.error('Name is required'); return false; }
    if (!form.email.trim()) { toast.error('Email is required'); return false; }
    if (responseMode === 'url' && !responseUrl.trim()) { toast.error('Please paste your response sheet URL'); return false; }
    if (responseMode === 'upload' && !responseHtml) { toast.error('Please upload your response sheet HTML'); return false; }
    if (responseMode === 'manual' && !manualText.trim()) { toast.error('Please enter your answers'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        answerKeyId: form.answerKeyId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category,
      };
      if (responseMode === 'url') payload.responseUrl = responseUrl.trim();
      else if (responseMode === 'upload') payload.responseHtml = responseHtml;
      else payload.manualAnswers = manualText;

      const res = await fetch('/api/predict-rank', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        setResult(d.data);
        toast.success('Rank calculated!');
        // Scroll to results
        setTimeout(() => document.getElementById('rp-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      } else {
        toast.error(d.error || 'Failed to calculate rank');
      }
    } catch (e) { toast.error('Submission failed'); }
    setSubmitting(false);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form */}
      <Card className="lg:col-span-3 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            Predict from Response Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer key select */}
          <div>
            <Label>Select Exam / Answer Key *</Label>
            {loadingKeys ? (
              <div className="flex items-center gap-2 text-gray-500 h-12 px-3 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : keys.length === 0 ? (
              <div className="text-sm text-gray-500 px-3 py-2 border rounded-md bg-amber-50 border-amber-200">
                No answer keys available yet. Please check back later.
              </div>
            ) : (
              <Select value={form.answerKeyId} onValueChange={v => setForm(p => ({ ...p, answerKeyId: v }))}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Choose an answer key" /></SelectTrigger>
                <SelectContent>
                  {keys.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.title} {k.totalQuestions > 0 && <span className="text-xs text-gray-500">· {k.totalQuestions} Qs</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedKey && (
              <div className="mt-2 text-xs text-gray-600 bg-pink-50 border border-pink-200 rounded px-3 py-2">
                Marking: <span className="text-green-600 font-semibold">+{selectedKey.positiveMarks}</span> correct, <span className="text-red-600 font-semibold">−{selectedKey.negativeMarks}</span> wrong · {selectedKey.totalQuestions} questions
              </div>
            )}
          </div>

          {/* User details */}
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Response source */}
          <div>
            <Label>Provide Your Response Sheet</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: 'url', label: 'Paste URL', icon: <LinkIcon className="w-4 h-4" /> },
                { id: 'upload', label: 'Upload HTML', icon: <Upload className="w-4 h-4" /> },
                { id: 'manual', label: 'Enter Manually', icon: <ListChecks className="w-4 h-4" /> }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setResponseMode(opt.id)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md border transition-colors text-sm ${
                    responseMode === opt.id
                      ? 'bg-pink-50 border-pink-500 text-pink-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-3">
              {responseMode === 'url' && (
                <>
                  <Input
                    placeholder="https://cdn.digialm.com/..."
                    value={responseUrl}
                    onChange={(e) => setResponseUrl(e.target.value)}
                  />
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
                    <p className="font-semibold">⚠ TCS iON / GATE response URLs are often restricted to the candidate's IP/session.</p>
                    <p className="mt-1">If you get a fetch error, open the URL in your browser, save the page (Ctrl+S), and use <span className="font-semibold">"Upload HTML"</span> below.</p>
                  </div>
                </>
              )}
              {responseMode === 'upload' && (
                <>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-700 font-medium">Click to upload response sheet HTML</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {fileName ? <span className="text-pink-600">{fileName} ✓</span> : 'Save the response page from your browser (Ctrl+S → "Webpage, HTML Only") and upload the .html file.'}
                      </p>
                    </div>
                    <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={handleFile} />
                  </label>
                </>
              )}
              {responseMode === 'manual' && (
                <>
                  <Textarea
                    rows={6}
                    placeholder={'Enter your answers, one per line or comma-separated:\n1: A\n2: C\n3: --\nOR\n1:A, 2:C, 3:--, 4:B'}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use <code>--</code> or leave blank for unattempted. Options can be A/B/C/D or 1/2/3/4. For NAT, enter the numeric answer.</p>
                </>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-base">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating...</> : <>Predict My Rank <TrendingUp className="w-4 h-4 ml-2" /></>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="lg:col-span-2 space-y-4" id="rp-result">
        {result ? (
          <>
            {/* No-match warning */}
            {Array.isArray(result.unmatchedCsvIds) && result.unmatchedCsvIds.length > 0 && result.correct === 0 && result.wrong === 0 && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="p-4 text-sm">
                  <p className="font-semibold text-red-700 mb-1">⚠ No Question IDs matched!</p>
                  <p className="text-red-700">None of the Question IDs in the answer key matched the ones in your response sheet. Please verify that the admin's CSV uses the <span className="font-semibold">same Question IDs</span> as your exam.</p>
                  {Array.isArray(result.extractedQuestionIds) && result.extractedQuestionIds.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-red-800 underline">View IDs extracted from your sheet ({result.extractedQuestionIds.length})</summary>
                      <div className="mt-1 max-h-28 overflow-y-auto bg-white border border-red-200 rounded p-2 text-xs font-mono">
                        {result.extractedQuestionIds.join(', ')}
                      </div>
                    </details>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-800 underline">View CSV Question IDs ({result.unmatchedCsvIds.length})</summary>
                    <div className="mt-1 max-h-28 overflow-y-auto bg-white border border-red-200 rounded p-2 text-xs font-mono">
                      {result.unmatchedCsvIds.join(', ')}
                    </div>
                  </details>
                </CardContent>
              </Card>
            )}

            {/* Marks hero */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-pink-500 to-cyan-600 text-white">
              <CardContent className="p-6 text-center">
                <p className="text-sm opacity-90 mb-1">Your Marks</p>
                <p className="text-5xl font-bold mb-2">{result.marks}</p>
                <p className="text-sm opacity-90">out of {result.maxMarks}</p>
                <div className="mt-4 pt-4 border-t border-white/30 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-90 text-xs">Percentage</p>
                    <p className="text-xl font-bold">{result.percentage}%</p>
                  </div>
                  <div>
                    <p className="opacity-90 text-xs">Percentile</p>
                    <p className="text-xl font-bold">{result.percentile}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rank */}
            <Card className="shadow-md">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-gray-900">Overall Rank</span>
                  </div>
                  <div className="text-2xl font-bold text-pink-600">{result.overallRank}</div>
                </div>
                <p className="text-xs text-gray-500">out of {result.totalParticipants} {result.totalParticipants === 1 ? 'participant' : 'participants'}</p>
                <div className="border-t pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold text-gray-900">{result.category} Rank</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{result.categoryRank}</div>
                </div>
                <p className="text-xs text-gray-500">within {result.categoryTotal} {result.category} participants</p>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card className="shadow-md">
              <CardContent className="p-5">
                <p className="font-semibold text-gray-900 mb-3">Answer Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-green-50">
                    <span className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-600" /> Correct</span>
                    <span className="font-bold text-green-600">{result.correct}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-red-50">
                    <span className="flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500" /> Incorrect</span>
                    <span className="font-bold text-red-500">{result.wrong}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <span className="flex items-center gap-2 text-sm"><MinusCircle className="w-4 h-4 text-gray-500" /> Unattempted</span>
                    <span className="font-bold text-gray-600">{result.unattempted}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
                  <p>Total questions: <span className="font-semibold text-gray-700">{result.totalQuestions}</span></p>
                  <p>Attempted: <span className="font-semibold text-gray-700">{result.attempted}</span></p>
                  <p>Marking: <span className="text-green-600">+{result.positiveMarks}</span> / <span className="text-red-500">−{result.negativeMarks}</span></p>
                  {result.extractedAnswerCount !== undefined && (
                    <p>Extracted from sheet: <span className="font-semibold text-gray-700">{result.extractedAnswerCount}</span> responses</p>
                  )}
                </div>

                {/* Per-question breakdown */}
                {Array.isArray(result.details) && result.details.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm text-pink-700 cursor-pointer hover:underline">View per-question breakdown</summary>
                    <div className="mt-2 max-h-64 overflow-y-auto border rounded">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-2">Q.ID</th>
                            <th className="text-left p-2">Correct</th>
                            <th className="text-left p-2">Your Ans</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.details.map((d, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2 font-mono">{d.question_id}</td>
                              <td className="p-2 font-mono">{d.correct_answer}</td>
                              <td className="p-2 font-mono">{d.user_answer || '—'}</td>
                              <td className="p-2">
                                {d.status === 'correct' && <span className="text-green-600 font-semibold">✓ Correct</span>}
                                {d.status === 'wrong' && <span className="text-red-500 font-semibold">✗ Wrong</span>}
                                {d.status === 'unattempted' && <span className="text-gray-500">— Skipped</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-500 text-center px-4">
              * Rank is calculated dynamically based on all submissions for this answer key. It updates as more users submit.
            </p>
          </>
        ) : (
          <Card className="shadow-md border-dashed">
            <CardContent className="p-10 text-center">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Submit your response sheet to see your predicted rank, percentile, and detailed breakdown.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// -------- Quick Estimate (legacy) --------
function QuickEstimate() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({ exam: '', score: '', totalMarks: '100' });
  const exams = [
    { slug: 'gate', name: 'GATE', totalMarks: 100 },
    { slug: 'cat', name: 'CAT', totalMarks: 300 },
    { slug: 'jee-main', name: 'JEE Main', totalMarks: 300 },
    { slug: 'neet', name: 'NEET', totalMarks: 720 },
    { slug: 'upsc', name: 'UPSC Prelims', totalMarks: 200 }
  ];
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/rank-predictor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSlug: formData.exam, score: parseFloat(formData.score), totalMarks: parseFloat(formData.totalMarks) })
      });
      const d = await res.json();
      if (d.success) setResult(d.data);
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  };
  const onExamChange = (v) => {
    const exam = exams.find(e => e.slug === v);
    setFormData({ ...formData, exam: v, totalMarks: exam?.totalMarks.toString() || '100' });
    setResult(null);
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-pink-600" /> Enter Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Select Exam</Label>
              <Select value={formData.exam} onValueChange={onExamChange}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Choose an exam" /></SelectTrigger>
                <SelectContent>{exams.map(x => <SelectItem key={x.slug} value={x.slug}>{x.name} (Total: {x.totalMarks})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Your Expected Score</Label>
              <Input type="number" value={formData.score} onChange={e => setFormData({ ...formData, score: e.target.value })} required className="h-12" />
            </div>
            <div>
              <Label>Total Marks</Label>
              <Input type="number" value={formData.totalMarks} readOnly className="h-12 bg-gray-50" />
            </div>
            <Button type="submit" className="w-full h-12 bg-pink-600 hover:bg-pink-700" disabled={loading || !formData.exam || !formData.score}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Predict My Rank'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className={`shadow-lg transition-all ${result ? 'opacity-100' : 'opacity-50'}`}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-pink-600" /> Estimated Results</CardTitle></CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="text-center p-5 bg-pink-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Your Score Percentage</p>
                <p className="text-4xl font-bold text-pink-600">{result.percentage.toFixed(1)}%</p>
              </div>
              <div className="text-center p-5 bg-rose-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Expected Rank Range</p>
                <p className="text-3xl font-bold text-rose-600">{result.rankRange.min.toLocaleString()} – {result.rankRange.max.toLocaleString()}</p>
              </div>
              {result.recommendations && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Recommended Colleges</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {result.recommendations.map((r, i) => <li key={i} className="px-3 py-2 bg-gray-50 rounded">• {r}</li>)}
                  </ul>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">* Estimated from historical data only.</p>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Enter details to see rank estimate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RankPredictorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      <div className="pt-20 pb-12 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Target className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Rank Predictor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your exam response sheet to get an accurate, data-driven rank prediction based on all submissions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="sheet" className="w-full">
            <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="sheet" className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Response Sheet</TabsTrigger>
              <TabsTrigger value="quick" className="flex items-center gap-2"><Percent className="w-4 h-4" /> Quick Estimate</TabsTrigger>
            </TabsList>
            <TabsContent value="sheet"><ResponseSheetPredictor /></TabsContent>
            <TabsContent value="quick"><QuickEstimate /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
