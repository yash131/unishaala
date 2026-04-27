'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainNavbar } from '@/components/MainNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2, TrendingUp, Trophy, ClipboardList, BookOpen, Target, Crown,
  Clock, CheckCircle, XCircle, CreditCard, Activity, Award, Percent, Timer
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const TYPE_LABEL = {
  mock_test: 'Mock',
  practice_questions: 'Practice',
  previous_year: 'PYQ',
};

const TAB_FILTERS = {
  all: () => true,
  mock_test: (h) => h.testType === 'mock_test',
  practice_questions: (h) => h.testType === 'practice_questions',
  previous_year: (h) => h.testType === 'previous_year',
};

const PIE_COLORS = ['#16a34a', '#dc2626', '#94a3b8'];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user/analytics', { credentials: 'include' });
        if (r.status === 401) { router.push('/login?next=/dashboard'); return; }
        const d = await r.json();
        if (d.success) setData(d.data);
        else toast.error(d.error || 'Failed to load analytics');
      } catch (_e) { toast.error('Failed to load analytics'); }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="pt-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { summary, history, purchases } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="pt-24 pb-12 container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
            <p className="text-gray-600">Track your performance, progress and purchases.</p>
          </div>
          {summary.hasPass ? (
            <Badge className="bg-amber-500 text-white flex items-center gap-1 text-sm py-1.5 px-3">
              <Crown className="w-4 h-4" /> Active Get Pass
              {summary.passExpiresAt && (
                <span className="ml-1 font-normal opacity-90">
                  till {new Date(summary.passExpiresAt).toLocaleDateString()}
                </span>
              )}
            </Badge>
          ) : (
            <Link href="/get-pass">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Crown className="w-4 h-4 mr-2" /> Get Pass
              </Button>
            </Link>
          )}
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<ClipboardList />} color="bg-blue-100 text-blue-700"
            label="Exams Attempted" value={summary.examsAttempted} />
          <StatCard icon={<BookOpen />} color="bg-emerald-100 text-emerald-700"
            label="Tests Attempted" value={summary.testsAttempted} />
          <StatCard icon={<Target />} color="bg-purple-100 text-purple-700"
            label="Average Score" value={`${summary.averagePct}%`} />
          <StatCard icon={<Trophy />} color="bg-amber-100 text-amber-700"
            label="Best Score" value={`${summary.bestPct}%`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Activity />} color="bg-indigo-100 text-indigo-700"
            label="Total Attempts" value={summary.totalAttempts} />
          <StatCard icon={<Percent />} color="bg-teal-100 text-teal-700"
            label="Accuracy" value={`${summary.accuracy}%`} />
          <StatCard icon={<Award />} color="bg-pink-100 text-pink-700"
            label="Correct" value={summary.totalCorrect} />
          <StatCard icon={<Timer />} color="bg-orange-100 text-orange-700"
            label="Time Spent" value={formatMin(summary.totalTimeMin)} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mock_test">Mock Tests</TabsTrigger>
            <TabsTrigger value="practice_questions">Practice</TabsTrigger>
            <TabsTrigger value="previous_year">PYQs</TabsTrigger>
          </TabsList>

          {Object.keys(TAB_FILTERS).map(tabKey => (
            <TabsContent key={tabKey} value={tabKey} className="mt-6 space-y-6">
              <TabContent
                history={history.filter(TAB_FILTERS[tabKey])}
                tabKey={tabKey}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Purchases */}
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <h2 className="text-xl font-bold text-gray-900">Purchases</h2>
              <span className="ml-auto text-sm text-gray-500">{purchases.length} item{purchases.length === 1 ? '' : 's'}</span>
            </div>
            {purchases.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-600">No purchases yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{purchaseTypeLabel(p.paymentType)}</Badge>
                        </TableCell>
                        <TableCell>₹{Number(p.amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          {p.status === 'SUCCESS'
                            ? <Badge className="bg-green-500">Success</Badge>
                            : p.status === 'PENDING'
                              ? <Badge className="bg-amber-500">Pending</Badge>
                              : <Badge className="bg-red-500">Failed</Badge>}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function purchaseTypeLabel(t) {
  switch (t) {
    case 'get_pass': return 'Get Pass';
    case 'exam_purchase': return 'Test Series';
    case 'domain_purchase': return 'Domain';
    case 'exam_pyq_purchase': return 'PYQ Series';
    case 'domain_pyq_purchase': return 'PYQ Domain';
    default: return t || '—';
  }
}

function formatMin(min) {
  if (!min || min < 1) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function pct(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function TabContent({ history, tabKey }) {
  const completed = history.filter(h => h.status === 'COMPLETED' || h.endTime);

  // Bar chart: score % for last 10 attempts (oldest -> newest)
  const barData = useMemo(() => {
    return [...completed]
      .sort((a, b) => new Date(a.endTime || a.startTime) - new Date(b.endTime || b.startTime))
      .slice(-10)
      .map((h, idx) => ({
        name: shortName(h.testTitle, idx + 1),
        score: pct(h.score, h.totalMarks),
        full: h.testTitle,
      }));
  }, [completed]);

  // Line chart: avg score % grouped by date (last 30 days)
  const lineData = useMemo(() => {
    const map = new Map();
    completed.forEach(h => {
      const d = new Date(h.endTime || h.startTime);
      const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const cur = map.get(key) || { sum: 0, n: 0 };
      cur.sum += pct(h.score, h.totalMarks);
      cur.n += 1;
      map.set(key, cur);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([k, v]) => ({
        date: k.slice(5), // MM-DD
        avg: Math.round(v.sum / v.n),
      }));
  }, [completed]);

  // Pie chart: correct vs incorrect vs unanswered
  const pieData = useMemo(() => {
    const totals = completed.reduce((acc, e) => {
      acc.correct += e.correct || 0;
      acc.incorrect += e.incorrect || 0;
      acc.unanswered += e.unanswered || 0;
      return acc;
    }, { correct: 0, incorrect: 0, unanswered: 0 });
    return [
      { name: 'Correct', value: totals.correct },
      { name: 'Incorrect', value: totals.incorrect },
      { name: 'Unanswered', value: totals.unanswered },
    ];
  }, [completed]);

  const hasPie = pieData.some(p => p.value > 0);

  // Subject-wise accuracy
  const subjectStats = useMemo(() => {
    const map = new Map();
    completed.forEach(h => {
      const key = h.subjectName || h.domainName || h.examName || 'Other';
      const cur = map.get(key) || { name: key, sum: 0, n: 0, correct: 0, total: 0 };
      cur.sum += pct(h.score, h.totalMarks);
      cur.n += 1;
      cur.correct += h.correct || 0;
      cur.total += (h.correct || 0) + (h.incorrect || 0);
      map.set(key, cur);
    });
    return [...map.values()]
      .map(s => ({
        name: s.name,
        avg: Math.round(s.sum / s.n),
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        attempts: s.n,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [completed]);

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No attempts yet</h3>
          <p className="text-gray-500 mt-1">
            {tabKey === 'all'
              ? 'Start a test to see your performance here.'
              : `You have not attempted any ${TYPE_LABEL[tabKey] || ''} tests yet.`}
          </p>
          <Link href={tabKey === 'previous_year' ? '/previous-year' : tabKey === 'practice_questions' ? '/practice' : '/exams'} className="mt-4 inline-block">
            <Button className="bg-brand-600 hover:bg-brand-700">Browse Tests</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold">Recent Test Scores (last 10)</h3>
            </div>
            {barData.length === 0 ? (
              <EmptyChart label="No completed attempts yet" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Score']}
                    labelFormatter={(_l, p) => p?.[0]?.payload?.full || ''}
                  />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold">Answer Breakdown</h3>
            </div>
            {!hasPie ? (
              <EmptyChart label="No answered questions yet" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    label={(e) => `${e.name}: ${e.value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold">Performance Over Time</h3>
            </div>
            {lineData.length === 0 ? (
              <EmptyChart label="No completed attempts yet" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                  <Line type="monotone" dataKey="avg" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      {subjectStats.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold">Subject / Domain Performance</h3>
            </div>
            <div className="space-y-3">
              {subjectStats.map((s, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      {s.name}
                      <span className="text-gray-400 ml-2 font-normal">({s.attempts} attempt{s.attempts === 1 ? '' : 's'})</span>
                    </span>
                    <span className="text-gray-600">
                      Avg: <b>{s.avg}%</b>
                      {s.accuracy > 0 && <> · Accuracy: <b>{s.accuracy}%</b></>}
                    </span>
                  </div>
                  <Progress value={s.avg} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Test History</h3>
            <span className="ml-auto text-sm text-gray-500">{history.length} attempt{history.length === 1 ? '' : 's'}</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Exam / Domain</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(h => {
                  const percentage = pct(h.score, h.totalMarks);
                  const completedRow = h.status === 'COMPLETED' || h.endTime;
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={h.testTitle}>{h.testTitle}</div>
                        {h.subjectName && (
                          <div className="text-xs text-gray-500 truncate">{h.subjectName}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium text-gray-700">{h.examName || '—'}</div>
                        {h.domainName && <div className="text-xs text-gray-500">{h.domainName}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TYPE_LABEL[h.testType] || 'Mock'}</Badge>
                      </TableCell>
                      <TableCell>
                        {completedRow
                          ? <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>
                          : <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> In progress</Badge>}
                      </TableCell>
                      <TableCell>
                        {completedRow ? (
                          <div>
                            <div className="font-semibold">{h.score} / {h.totalMarks}</div>
                            <div className="text-xs text-gray-500">{percentage}%</div>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {h.rank
                          ? <span className="font-semibold">#{h.rank}<span className="text-xs text-gray-500 ml-1">/ {h.totalTakers}</span></span>
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {h.timeTakenMin != null ? formatMin(h.timeTakenMin) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {h.startTime ? new Date(h.startTime).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        {completedRow && (
                          <Link href={`/test-result/${h.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function shortName(title, idx) {
  if (!title) return `T${idx}`;
  if (title.length <= 12) return title;
  return title.slice(0, 10) + '…';
}

function EmptyChart({ label }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
      {label}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
