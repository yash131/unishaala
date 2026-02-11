'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Logo } from '@/components/Logo';
import {
  GraduationCap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertCircle,
  Play,
  List
} from 'lucide-react';
import { toast } from 'sonner';

export default function MockTestPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showQuestionNav, setShowQuestionNav] = useState(false);

  useEffect(() => {
    async function fetchTest() {
      try {
        const response = await fetch(`/api/mock-test/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setTest(result.data);
          setTimeLeft(result.data.duration * 60);
        }
      } catch (error) {
        console.error('Error fetching test:', error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchTest();
    }
  }, [params.id]);

  useEffect(() => {
    let timer;
    if (started && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = async () => {
    try {
      const response = await fetch('/api/start-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTestId: params.id })
      });

      const result = await response.json();

      if (result.success) {
        setAttemptId(result.data.attemptId);
        
        // Fetch questions
        const qResponse = await fetch(`/api/mock-test-questions/${params.id}`);
        const qResult = await qResponse.json();
        if (qResult.success) {
          setQuestions(qResult.data);
        }
        
        setStarted(true);
      } else {
        if (result.requirePayment) {
          toast.error('Please purchase this test to continue');
        } else {
          toast.error(result.error || 'Please login to start test');
          router.push('/login');
        }
      }
    } catch (error) {
      toast.error('Failed to start test');
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleFlagQuestion = () => {
    const qId = questions[currentQuestion]?.id;
    setFlagged({ ...flagged, [qId]: !flagged[qId] });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test submitted successfully!');
        router.push(`/test-result/${attemptId}`);
      } else {
        toast.error('Failed to submit test');
      }
    } catch (error) {
      toast.error('Failed to submit test');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Test not found</p>
      </div>
    );
  }

  // Instructions Screen
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Logo size="default" showText={false} />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center border-b">
                <CardTitle className="text-2xl">{test.title}</CardTitle>
                <p className="text-gray-500">{test.description}</p>
              </CardHeader>
              <CardContent className="p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Test Instructions</h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-teal-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-teal-600">{test.duration}</p>
                    <p className="text-sm text-gray-600">Minutes</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{test.totalQuestions}</p>
                    <p className="text-sm text-gray-600">Questions</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{test.totalMarks}</p>
                    <p className="text-sm text-gray-600">Total Marks</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">Each question carries equal marks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">Negative marking may apply for wrong answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">You can navigate between questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">You can flag questions for review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <span className="text-gray-600">Test will auto-submit when time expires</span>
                  </li>
                </ul>

                <Button 
                  className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-lg"
                  onClick={handleStartTest}
                >
                  <Play className="w-5 h-5 mr-2" /> Start Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Test Interface
  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Test Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 hidden md:block">{test.title}</span>
            </div>

            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => setShowQuestionNav(!showQuestionNav)}
                className="hidden md:flex"
              >
                <List className="w-4 h-4 mr-2" /> Questions
              </Button>
              
              <Button 
                className="bg-rose-500 hover:bg-rose-600"
                onClick={() => setShowSubmitDialog(true)}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Test Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-teal-600">
                      Question {currentQuestion + 1} of {questions.length}
                    </Badge>
                    {currentQ?.marks && (
                      <Badge variant="secondary">{currentQ.marks} Marks</Badge>
                    )}
                  </div>
                  <Button
                    variant={flagged[currentQ?.id] ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleFlagQuestion}
                    className={flagged[currentQ?.id] ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    <Flag className="w-4 h-4 mr-1" /> {flagged[currentQ?.id] ? 'Flagged' : 'Flag'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {currentQ && (
                  <>
                    <div className="mb-6">
                      <p className="text-lg text-gray-900 leading-relaxed">
                        {currentQ.questionText}
                      </p>
                    </div>

                    <RadioGroup
                      value={answers[currentQ.id]?.toString() || ''}
                      onValueChange={(value) => handleAnswerSelect(currentQ.id, parseInt(value))}
                    >
                      <div className="space-y-3">
                        {currentQ.options?.map((option, index) => (
                          <Label
                            key={index}
                            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                              answers[currentQ.id] === index + 1
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <RadioGroupItem value={(index + 1).toString()} />
                            <span className="text-gray-700">{option}</span>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    disabled={currentQuestion === 0}
                    onClick={() => setCurrentQuestion(currentQuestion - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button
                    disabled={currentQuestion === questions.length - 1}
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Navigation Panel */}
          <div className={`lg:block ${showQuestionNav ? 'block' : 'hidden'}`}>
            <Card className="shadow-lg sticky top-24">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Question Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {questions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        currentQuestion === index
                          ? 'bg-teal-600 text-white'
                          : answers[q.id]
                          ? 'bg-green-500 text-white'
                          : flagged[q.id]
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div> Answered
                    </span>
                    <span>{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div> Flagged
                    </span>
                    <span>{flaggedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div> Not Answered
                    </span>
                    <span>{questions.length - answeredCount}</span>
                  </div>
                </div>

                <Progress 
                  value={(answeredCount / questions.length) * 100} 
                  className="mt-4 h-2"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {answeredCount}/{questions.length} answered
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
                  <p className="text-sm text-gray-500">Answered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{flaggedCount}</p>
                  <p className="text-sm text-gray-500">Flagged</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{questions.length - answeredCount}</p>
                  <p className="text-sm text-gray-500">Unanswered</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-center mb-4">
              Are you sure you want to submit? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowSubmitDialog(false)}
              >
                Continue Test
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handleSubmit}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
