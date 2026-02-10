'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  ArrowLeft
} from 'lucide-react';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-teal-700">Unishaala</span>
          </Link>
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
    if (!test.isFree && test.price > 0) {
      setSelectedTest(test);
      setShowUnlockModal(true);
    } else {
      window.location.href = `/mock-test/${test.id}`;
    }
  };

  const handlePayment = async () => {
    // Mock payment - redirect to test after "payment"
    setShowUnlockModal(false);
    alert('Payment feature will be enabled soon. For now, redirecting to test...');
    window.location.href = `/mock-test/${selectedTest.id}`;
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.name}</h1>
              <p className="text-lg text-teal-600 font-medium mb-2">{exam.fullName}</p>
              <p className="text-gray-600 max-w-2xl">{exam.description}</p>
              <div className="flex items-center gap-6 mt-4">
                <Badge className="bg-teal-100 text-teal-700">{exam.category}</Badge>
                <span className="text-sm text-gray-600">{exam.totalTests} Mock Tests</span>
                <span className="text-sm text-gray-600">{exam.totalQuestions} Questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mock-tests" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow rounded-lg h-14">
            <TabsTrigger value="mock-tests" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <ClipboardList className="w-4 h-4 mr-2" /> Mock Tests
            </TabsTrigger>
            <TabsTrigger value="question-bank" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <BookOpen className="w-4 h-4 mr-2" /> Question Bank
            </TabsTrigger>
            <TabsTrigger value="previous-papers" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <FileText className="w-4 h-4 mr-2" /> Previous Papers
            </TabsTrigger>
            <TabsTrigger value="topper-notes" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <Trophy className="w-4 h-4 mr-2" /> Topper Notes
            </TabsTrigger>
          </TabsList>

          {/* Mock Tests Tab */}
          <TabsContent value="mock-tests">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTests?.length > 0 ? mockTests.map((test) => (
                <Card key={test.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-teal-600" />
                      </div>
                      {test.isFree ? (
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
                      <span>{test.totalQuestions} Qs</span>
                      <span>{test.totalMarks} Marks</span>
                    </div>
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => handleStartTest(test)}
                    >
                      {test.isFree ? (
                        <><Play className="w-4 h-4 mr-2" /> Start Test</>
                      ) : (
                        <><Lock className="w-4 h-4 mr-2" /> Unlock & Start</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-gray-500 col-span-3 text-center py-8">No mock tests available yet</p>
              )}
            </div>
          </TabsContent>

          {/* Question Bank Tab */}
          <TabsContent value="question-bank">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Question Bank</h3>
                <p className="text-gray-600 mb-4">{questionBankCount || 0} questions available</p>
                <p className="text-gray-500 mb-6">Practice topic-wise questions with detailed solutions</p>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Previous Papers Tab */}
          <TabsContent value="previous-papers">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousPapers?.length > 0 ? previousPapers.map((paper) => (
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
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Previous papers will be available soon</p>
                  </CardContent>
                </Card>
              )}
            </div>
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
            <DialogTitle className="text-2xl">Unlock This Test</DialogTitle>
            <DialogDescription>
              Get full access to this premium mock test
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTest && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{selectedTest.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{selectedTest.description}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{selectedTest.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Questions</span>
                  <span className="font-medium">{selectedTest.totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-semibold">Price</span>
                  <span className="text-2xl font-bold text-teal-600">₹{selectedTest.price}</span>
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
                </ul>
                <Button 
                  className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6"
                  onClick={handlePayment}
                >
                  Pay ₹{selectedTest.price} & Start Test
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
