'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Logo } from '@/components/Logo';
import {
  GraduationCap,
  Menu,
  X,
  FileText,
  BookOpen,
  Trophy,
  ClipboardList,
  Clock,
  Play,
  Lock,
  Download,
  CheckCircle,
  ArrowLeft,
  History,
  Medal,
  Users,
  TrendingUp,
  Crown,
  Award,
  Target
} from 'lucide-react';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="default" showText={false} />
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-teal-600 text-teal-600">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-rose-500 hover:bg-rose-600">Sign Up</Button>
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

// Leaderboard Component
function LeaderboardTab({ examSlug }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [examInfo, setExamInfo] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchMyRank();
  }, [examSlug]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/leaderboard/${examSlug}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.data.leaderboard);
        setExamInfo(data.data.exam);
        setTotalParticipants(data.data.totalParticipants);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    }
    setLoading(false);
  };

  const fetchMyRank = async () => {
    try {
      const res = await fetch(`/api/my-rank/${examSlug}`);
      const data = await res.json();
      if (data.success && data.data.rank) {
        setMyRank(data.data);
      }
    } catch (e) {
      // User not logged in or no attempts
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{rank}</span>;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    if (rank <= 10) return 'bg-teal-100 text-teal-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">{totalParticipants}</p>
            <p className="text-sm opacity-80">Total Participants</p>
          </CardContent>
        </Card>
        
        {myRank && (
          <>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-3xl font-bold">#{myRank.rank}</p>
                <p className="text-sm opacity-80">Your Rank</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-3xl font-bold">{myRank.bestScore}/{myRank.totalMarks}</p>
                <p className="text-sm opacity-80">Your Best Score</p>
              </CardContent>
            </Card>
          </>
        )}
        
        {!myRank && (
          <Card className="md:col-span-2 bg-gray-50">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Login and attempt a test to see your rank!</p>
              <Link href="/login">
                <Button className="mt-2 bg-teal-600 hover:bg-teal-700">Login Now</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Rank Card (if logged in) */}
      {myRank && (
        <Card className="mb-6 border-2 border-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${getRankBadge(myRank.rank)}`}>
                  {getRankIcon(myRank.rank)}
                </div>
                <div>
                  <p className="font-bold text-lg">Your Position</p>
                  <p className="text-gray-500">Rank #{myRank.rank} of {myRank.totalParticipants}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-teal-600">{myRank.bestScore}</p>
                <p className="text-sm text-gray-500">Best Score</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">Top {100 - myRank.percentile}%</p>
                <p className="text-sm text-gray-500">Percentile</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{myRank.attempts}</p>
                <p className="text-sm text-gray-500">Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Live Leaderboard
            <Badge className="ml-2 bg-green-500">Real-time</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Best Score</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Accuracy</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.userId} 
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                          {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-teal-600">
                              {entry.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{entry.name}</p>
                            {entry.rank === 1 && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">🏆 Top Scorer</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-lg text-gray-900">{entry.bestScore}</span>
                        <span className="text-gray-400">/{entry.totalMarks}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                entry.accuracy >= 80 ? 'bg-green-500' : 
                                entry.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${entry.accuracy}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{entry.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="outline">{entry.attempts}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No rankings yet</p>
              <p className="text-gray-400">Be the first to attempt a test and top the leaderboard!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExamDetailPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    async function fetchExamDetail() {
      try {
        const response = await fetch(`/api/exams/${params.slug}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching exam detail:', error);
      } finally {
        setLoading(false);
      }
    }
    if (params.slug) {
      fetchExamDetail();
    }
  }, [params.slug]);

  const handleStartTest = (test) => {
    // Check if exam requires purchase
    const examPrice = data?.exam?.price || 0;
    if (examPrice > 0) {
      setSelectedTest({ ...test, examPrice, isExamPurchase: true });
      setShowUnlockModal(true);
    } else if (!test.isFree && test.price > 0) {
      setSelectedTest(test);
      setShowUnlockModal(true);
    } else {
      window.location.href = `/mock-test/${test.id}`;
    }
  };

  const handlePayment = async () => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      alert('Please login to make payment');
      window.location.href = '/login';
      return;
    }

    try {
      const amount = selectedTest?.isExamPurchase ? exam.price : selectedTest?.price;
      
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedTest?.isExamPurchase ? exam.id : null,
          mockTestId: selectedTest?.isExamPurchase ? null : selectedTest?.id,
          amount: amount,
          paymentType: selectedTest?.isExamPurchase ? 'exam_purchase' : 'test_purchase'
        })
      });

      const result = await response.json();

      if (result.success && result.data.paymentUrl) {
        // Redirect to ICICI payment page
        window.location.href = result.data.paymentUrl;
      } else {
        alert(result.error || 'Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initiation failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data?.exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Exam not found</p>
      </div>
    );
  }

  const { exam, mockTests, previousPapers, topperNotes, questionBankCount } = data;

  // Group tests by type
  const mockTestsOnly = mockTests?.filter(t => !t.testType || t.testType === 'mock_test') || [];
  const practiceQuestions = mockTests?.filter(t => t.testType === 'practice_questions') || [];
  const previousYearTests = mockTests?.filter(t => t.testType === 'previous_year') || [];

  const renderTestCard = (test) => (
    <Card key={test.id} className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            {test.testType === 'practice_questions' ? (
              <BookOpen className="w-6 h-6 text-teal-600" />
            ) : test.testType === 'previous_year' ? (
              <History className="w-6 h-6 text-purple-600" />
            ) : (
              <ClipboardList className="w-6 h-6 text-teal-600" />
            )}
          </div>
          {exam.price > 0 ? (
            <Badge className="bg-amber-100 text-amber-700">Premium</Badge>
          ) : test.isFree ? (
            <Badge className="bg-green-100 text-green-700">FREE</Badge>
          ) : (
            <Badge className="bg-rose-100 text-rose-700">₹{test.price}</Badge>
          )}
        </div>
        <h3 className="font-bold text-gray-900 mb-2">{test.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{test.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {test.duration} min
          </span>
          <span>{test.questionCount || test.totalQuestions} Qs</span>
          <span>{test.totalMarks} Marks</span>
        </div>
        <Button 
          className="w-full bg-teal-600 hover:bg-teal-700"
          onClick={() => handleStartTest(test)}
        >
          {exam.price > 0 || (!test.isFree && test.price > 0) ? (
            <><Lock className="w-4 h-4 mr-2" /> Unlock & Start</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Start Test</>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-20 bg-gradient-to-b from-teal-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Link href="/exams" className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Exams
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center text-4xl">
              {exam.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.name}</h1>
              <p className="text-lg text-teal-600 font-medium mb-2">{exam.fullName}</p>
              <p className="text-gray-600 max-w-2xl">{exam.description}</p>
              <div className="flex items-center gap-6 mt-4 flex-wrap">
                <Badge className="bg-teal-100 text-teal-700">{exam.category}</Badge>
                <span className="text-sm text-gray-600">{mockTests?.length || 0} Tests Available</span>
                {exam.price > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 text-lg px-3 py-1">
                    Full Access: ₹{exam.price}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mock-tests" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white shadow rounded-lg h-14">
            <TabsTrigger value="mock-tests" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <ClipboardList className="w-4 h-4 mr-2" /> Mock Tests
            </TabsTrigger>
            <TabsTrigger value="practice-questions" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <BookOpen className="w-4 h-4 mr-2" /> Practice
            </TabsTrigger>
            <TabsTrigger value="previous-papers" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <History className="w-4 h-4 mr-2" /> Previous Year
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <Trophy className="w-4 h-4 mr-2" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="topper-notes" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <Award className="w-4 h-4 mr-2" /> Toppers
            </TabsTrigger>
          </TabsList>

          {/* Mock Tests Tab */}
          <TabsContent value="mock-tests">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTestsOnly.length > 0 ? mockTestsOnly.map(renderTestCard) : (
                <p className="text-gray-500 col-span-3 text-center py-8">No mock tests available yet</p>
              )}
            </div>
          </TabsContent>

          {/* Practice Questions Tab */}
          <TabsContent value="practice-questions">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {practiceQuestions.length > 0 ? practiceQuestions.map(renderTestCard) : (
                <Card className="col-span-3">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Practice Questions</h3>
                    <p className="text-gray-600 mb-4">Topic-wise practice questions coming soon</p>
                    <p className="text-gray-500 mb-6">Practice with detailed solutions and explanations</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Previous Year Papers Tab */}
          <TabsContent value="previous-papers">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousYearTests.length > 0 ? previousYearTests.map(renderTestCard) : previousPapers?.length > 0 ? previousPapers.map((paper) => (
                <Card key={paper.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{paper.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{paper.year}</p>
                    <Button variant="outline" className="w-full border-teal-600 text-teal-600">
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-3">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Previous year papers will be available soon</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <LeaderboardTab examSlug={params.slug} />
          </TabsContent>

          {/* Topper Notes Tab */}
          <TabsContent value="topper-notes">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topperNotes?.length > 0 ? topperNotes.map((note) => (
                <Card key={note.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{note.title}</h3>
                    <p className="text-sm text-teal-600 mb-2">By {note.author}</p>
                    <p className="text-sm text-gray-500 mb-4">{note.rank}</p>
                    <Button variant="outline" className="w-full border-teal-600 text-teal-600">
                      <Download className="w-4 h-4 mr-2" /> Download Notes
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-3">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Topper notes will be available soon</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unlock Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedTest?.isExamPurchase ? 'Unlock Full Exam Access' : 'Unlock This Test'}
            </DialogTitle>
            <DialogDescription>
              {selectedTest?.isExamPurchase 
                ? 'Get access to all tests in this exam' 
                : 'Get full access to this premium test'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTest && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">
                    {selectedTest.isExamPurchase ? exam.name : selectedTest.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedTest.isExamPurchase 
                      ? `Full access to all Mock Tests, Practice Questions & Previous Year Papers` 
                      : selectedTest.description}
                  </p>
                </div>
                {!selectedTest.isExamPurchase && (
                  <>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{selectedTest.duration} minutes</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-medium">{selectedTest.questionCount || selectedTest.totalQuestions}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-semibold">Price</span>
                  <span className="text-2xl font-bold text-teal-600">
                    ₹{selectedTest.isExamPurchase ? exam.price : selectedTest.price}
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Detailed Solutions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Performance Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Attempts
                  </li>
                  {selectedTest.isExamPurchase && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Access to ALL test types
                    </li>
                  )}
                </ul>
                <Button 
                  className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6"
                  onClick={handlePayment}
                >
                  Pay ₹{selectedTest.isExamPurchase ? exam.price : selectedTest.price} & Start
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
