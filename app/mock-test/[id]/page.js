'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  List,
  AlertTriangle,
  Shield,
  Maximize,
  Monitor,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';

// Proctoring Warning Modal Component
function WarningModal({ isOpen, warningCount, onClose }) {
  const isLastWarning = warningCount >= 2;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-red-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            Warning {warningCount}/3
          </DialogTitle>
          <DialogDescription>
            Tab switching or window change detected!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className={`p-4 rounded-lg ${isLastWarning ? 'bg-red-100' : 'bg-orange-100'}`}>
            <p className={`font-semibold ${isLastWarning ? 'text-red-700' : 'text-orange-700'}`}>
              {isLastWarning 
                ? '⚠️ FINAL WARNING! One more switch will AUTO-SUBMIT your exam!'
                : 'Please stay on the exam window. Do not switch tabs or minimize the browser.'}
            </p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-500" />
              Switching tabs is not allowed during exam
            </p>
            <p className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-500" />
              Minimizing the window is not allowed
            </p>
            <p className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-500" />
              Exiting fullscreen is not allowed
            </p>
          </div>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
            <span className="text-lg font-bold text-gray-700">
              Warnings Remaining: {3 - warningCount}
            </span>
          </div>
        </div>
        <Button onClick={onClose} className="w-full bg-brand-600 hover:bg-brand-700">
          Return to Exam
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Auto Submit Warning Modal
function AutoSubmitModal({ isOpen }) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md border-2 border-red-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            Exam Auto-Submitted
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <p className="text-gray-700 font-medium">
            Your exam has been automatically submitted due to multiple tab switches.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Redirecting to results page...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  
  // Proctoring State
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    // Reset all client state when navigating between tests so we never render
    // stale questions/answers from a previous test.
    setTest(null);
    setQuestions([]);
    setAnswers({});
    setFlagged({});
    setStarted(false);
    setCurrentQuestion(0);
    setAttemptId(null);
    setLoading(true);

    async function fetchTest() {
      try {
        const response = await fetch(`/api/mock-test/${params.id}?_t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
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

  // Timer Effect
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

  // Handle tab/window violations
  const handleViolation = useCallback(() => {
    if (isSubmittingRef.current) return;
    
    const newWarningCount = warningCount + 1;
    setWarningCount(newWarningCount);
    
    if (newWarningCount >= 3) {
      // Auto-submit on 3rd violation
      isSubmittingRef.current = true;
      setShowAutoSubmitModal(true);
      setTimeout(() => {
        handleSubmit(true);
      }, 2000);
    } else {
      setShowWarningModal(true);
      toast.error(`Warning ${newWarningCount}/3: Stay on the exam window!`);
    }
  }, [warningCount]);

  // Proctoring Effects - Only active when test is started
  useEffect(() => {
    if (!started) return;

    // Tab visibility change detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    // Window blur detection
    const handleWindowBlur = () => {
      // Small delay to avoid false positives
      setTimeout(() => {
        if (!document.hasFocus()) {
          handleViolation();
        }
      }, 100);
    };

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && started && !isSubmittingRef.current) {
        handleViolation();
      }
    };

    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error('Right-click is disabled during exam');
      return false;
    };

    // Disable copy-paste and other shortcuts
    const handleKeyDown = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P, F12
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        toast.error('This shortcut is disabled during exam');
        return false;
      }
      
      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        toast.error('Screenshot is disabled during exam');
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent page unload without confirmation
    const handleBeforeUnload = (e) => {
      if (!isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = 'Your exam is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Disable copy event
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      toast.error('Copy is disabled during exam');
    });

    // Disable paste event
    document.addEventListener('paste', (e) => {
      e.preventDefault();
      toast.error('Paste is disabled during exam');
    });

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [started, handleViolation]);

  // Enter fullscreen mode
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Please allow fullscreen mode to start the exam');
      return false;
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = async () => {
    try {
      // Enter fullscreen first
      const fullscreenOk = await enterFullscreen();
      if (!fullscreenOk) {
        toast.error('Fullscreen mode is required to start the exam');
        return;
      }

      const response = await fetch('/api/start-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTestId: params.id })
      });

      const result = await response.json();

      if (result.success) {
        setAttemptId(result.data.attemptId);
        
        // Fetch questions (always bypass caches so newly-imported images show up)
        const qResponse = await fetch(`/api/mock-test-questions/${params.id}?_t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const qResult = await qResponse.json();
        if (qResult.success) {
          setQuestions(qResult.data);
        }
        
        setStarted(true);
        toast.success('Exam started! Stay in fullscreen mode.');
      } else {
        // Exit fullscreen if test start fails
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        
        if (result.requirePayment) {
          toast.error('Please purchase this test to continue');
        } else {
          toast.error(result.error || 'Please login to start test');
          router.push('/login');
        }
      }
    } catch (error) {
      toast.error('Failed to start test');
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleFlagQuestion = () => {
    const qId = questions[currentQuestion]?.id;
    setFlagged({ ...flagged, [qId]: !flagged[qId] });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    isSubmittingRef.current = true;
    
    try {
      // Exit fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }

      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers })
      });

      const result = await response.json();

      if (result.success) {
        if (isAutoSubmit) {
          toast.error('Exam auto-submitted due to violations');
        } else {
          toast.success('Test submitted successfully!');
        }
        router.push(`/test-result/${attemptId}`);
      } else {
        toast.error('Failed to submit test');
        isSubmittingRef.current = false;
      }
    } catch (error) {
      toast.error('Failed to submit test');
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
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
                  <div className="bg-brand-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-brand-600">{test.duration}</p>
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

                <ul className="space-y-3 mb-6">
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

                {/* Proctoring Rules Section */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5" /> Exam Proctoring Rules
                  </h4>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <Maximize className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Exam will open in <strong>fullscreen mode</strong>. Exiting fullscreen = 1 warning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Monitor className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Tab switching</strong> or minimizing window = 1 warning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Ban className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Copy-paste & right-click</strong> are disabled during exam</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>After 3 warnings</strong>, your exam will be <strong>AUTO-SUBMITTED</strong></span>
                    </li>
                  </ul>
                </div>

                <Button 
                  className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-lg"
                  onClick={handleStartTest}
                >
                  <Play className="w-5 h-5 mr-2" /> Start Test (Enter Fullscreen)
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
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {/* Warning Indicator */}
      {warningCount > 0 && (
        <div className={`py-2 px-4 text-center text-white font-medium ${
          warningCount >= 2 ? 'bg-red-600' : 'bg-orange-500'
        }`}>
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Warnings: {warningCount}/3 - {warningCount >= 2 ? 'FINAL WARNING! Next switch = Auto Submit' : 'Stay on exam window'}
        </div>
      )}
      
      {/* Test Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_unishaala-web/artifacts/2nf9p203_Unishaala-logo.jpg"
                alt="Unishaala" 
                className="h-8 w-auto object-contain"
              />
              <span className="font-semibold text-gray-900 hidden md:block">{test.title}</span>
              {/* Proctoring Status */}
              <Badge className={`hidden md:flex ${isFullscreen ? 'bg-green-500' : 'bg-red-500'}`}>
                <Shield className="w-3 h-3 mr-1" />
                {isFullscreen ? 'Secured' : 'Not Fullscreen'}
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
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
                className="bg-brand-500 hover:bg-brand-600"
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
                    <Badge className="bg-brand-600">
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
                        {currentQ.questionText || currentQ.question_text || currentQ.question_title}
                      </p>
                      {/* Question Image */}
                      {(currentQ.question_image_url || currentQ.questionImageUrl) && (
                        <div className="mt-4">
                          <img 
                            src={currentQ.question_image_url || currentQ.questionImageUrl} 
                            alt="Question" 
                            className="max-w-full h-auto rounded-lg border shadow-sm"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      )}
                    </div>

                    <RadioGroup
                      value={answers[currentQ.id]?.toString() || ''}
                      onValueChange={(value) => handleAnswerSelect(currentQ.id, parseInt(value))}
                    >
                      <div className="space-y-3">
                        {currentQ.options?.map((option, index) => {
                          // Skip null/undefined options
                          if (!option) return null;
                          // Handle both array of strings and array of objects
                          const optionTitle = typeof option === 'string' ? option : (option?.title || option?.text || '');
                          // Check optionImages array from API or object format
                          const optionImageUrl = currentQ.optionImages?.[index] || 
                            (typeof option === 'object' ? (option?.image_url || option?.imageUrl) : null);
                          
                          return (
                            <Label
                              key={index}
                              className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                                answers[currentQ.id] === index + 1
                                  ? 'border-brand-500 bg-brand-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <RadioGroupItem value={(index + 1).toString()} className="mt-1" />
                              <div className="flex-1">
                                <span className="text-gray-700">{optionTitle}</span>
                                {optionImageUrl && (
                                  <img 
                                    src={optionImageUrl} 
                                    alt={`Option ${index + 1}`} 
                                    className="mt-2 max-w-full h-auto rounded border"
                                    style={{ maxHeight: '150px' }}
                                  />
                                )}
                              </div>
                            </Label>
                          );
                        })}
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
                    className="bg-brand-600 hover:bg-brand-700"
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
                          ? 'bg-brand-600 text-white'
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
                
                {/* Warning Status in Side Panel */}
                {warningCount > 0 && (
                  <div className={`mt-4 p-3 rounded-lg text-center ${
                    warningCount >= 2 ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    <p className={`text-sm font-bold ${
                      warningCount >= 2 ? 'text-red-700' : 'text-orange-700'
                    }`}>
                      ⚠️ Warnings: {warningCount}/3
                    </p>
                  </div>
                )}
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
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                onClick={() => handleSubmit(false)}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning Modal */}
      <WarningModal 
        isOpen={showWarningModal} 
        warningCount={warningCount}
        onClose={() => {
          setShowWarningModal(false);
          // Try to re-enter fullscreen after warning
          enterFullscreen();
        }}
      />

      {/* Auto Submit Modal */}
      <AutoSubmitModal isOpen={showAutoSubmitModal} />
    </div>
  );
}
