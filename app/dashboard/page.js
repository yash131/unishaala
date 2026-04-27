'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainNavbar } from '@/components/MainNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2, TrendingUp, Trophy, ClipboardList, BookOpen, Target, Crown,
  Clock, CheckCircle, XCircle, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <div className="pt-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      </div>
    );
  }

  if (!data) return null;
  const { summary, history, purchases } = data;

  const pct = (score, total) => total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="pt-24 pb-12 container mx-auto px-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Your performance at a glance.</p>
          </div>
          {summary.hasPass ? (
            <Badge className="bg-amber-500 text-white flex items-center gap-1 text-sm py-1.5 px-3">
              <Crown className="w-4 h-4" /> Active Get Pass
              {summary.passExpiresAt && <span className="ml-1 font-normal opacity-90">till {new Date(summary.passExpiresAt).toLocaleDateString()}</span>}
            </Badge>
          ) : (
            <Link href="/get-pass"><Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"><Crown className="w-4 h-4 mr-2" /> Get Pass</Button></Link>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<ClipboardList />} color="bg-blue-100 text-blue-700" label="Exams Attempted" value={summary.examsAttempted} />
          <StatCard icon={<BookOpen />} color="bg-green-100 text-green-700" label="Tests Attempted" value={summary.testsAttempted} />
          <StatCard icon={<Target />} color="bg-purple-100 text-purple-700" label="Average Score" value={`${summary.averagePct}%`} />
          <StatCard icon={<Trophy />} color="bg-amber-100 text-amber-700" label="Best Score" value={`${summary.bestPct}%`} />
        </div>

        {/* Test History */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="p-5 border-b flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h2 className="text-xl font-bold text-gray-900">Test History</h2>
              <span className="ml-auto text-sm text-gray-500">{history.length} attempt{history.length === 1 ? '' : 's'}</span>
            </div>
            {history.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600">No test attempts yet. Start a test to see your performance here.</p>
                <Link href="/exams" className="mt-3 inline-block"><Button className="bg-brand-600 hover:bg-brand-700">Browse Test Series</Button></Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Taken on</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map(h => {
                      const percentage = pct(h.score, h.totalMarks);
                      const completed = h.status === 'COMPLETED' || h.endTime;
                      return (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium max-w-xs"><div className="truncate">{h.testTitle}</div></TableCell>
                          <TableCell>{h.examName || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {h.testType === 'practice_questions' ? 'Practice' : h.testType === 'previous_year' ? 'PYQ' : 'Mock'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {completed ? <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge> : <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> In progress</Badge>}
                          </TableCell>
                          <TableCell>
                            {completed ? (
                              <div>
                                <div className="font-semibold">{h.score} / {h.totalMarks}</div>
                                <div className="text-xs text-gray-500">{percentage}%</div>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {h.rank ? <span className="font-semibold">#{h.rank}<span className="text-xs text-gray-500 ml-1">/ {h.totalTakers}</span></span> : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {h.startTime ? new Date(h.startTime).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

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
                          <Badge variant="outline">
                            {p.paymentType === 'get_pass' ? 'Get Pass' : p.paymentType === 'exam_purchase' ? 'Test Series' : p.paymentType === 'domain_purchase' ? 'Domain' : p.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{Number(p.amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          {p.status === 'SUCCESS' ? <Badge className="bg-green-500">Success</Badge> :
                            p.status === 'PENDING' ? <Badge className="bg-amber-500">Pending</Badge> :
                            <Badge className="bg-red-500">Failed</Badge>}
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

function StatCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
