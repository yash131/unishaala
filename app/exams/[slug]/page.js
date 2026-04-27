'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MainNavbar } from '@/components/MainNavbar';
import {
  FileText,
  BookOpen,
  Trophy,
  ClipboardList,
  Clock,
  Play,
  Lock,
  CheckCircle,
  ArrowLeft,
  History,
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function ExamDetailPage() {
  const params = useParams();
  const [exam, setExam] = useState(null);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [purchasedTests, setPurchasedTests] = useState(new Set());
  const [purchasedDomains, setPurchasedDomains] = useState(new Set());
  const [examPurchased, setExamPurchased] = useState(false);

  // Fetch exam and domains
  useEffect(() => {
    async function fetchExamData() {
      try {
        const response = await fetch(`/api/exams/${params.slug}`);
        const result = await response.json();
        if (result.success) {
          setExam(result.data.exam);
          setDomains(result.data.domains || []);
          
          // Fetch user purchases
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const purchaseRes = await fetch('/api/user/purchases', { credentials: 'include' });
              const purchaseData = await purchaseRes.json();
              if (purchaseData.success && purchaseData.data) {
                const purchasedTestSet = new Set();
                const purchasedDomainSet = new Set();
                let hasExamPurchase = false;
                
                purchaseData.data.forEach(p => {
                  if (p.mockTestId) purchasedTestSet.add(p.mockTestId);
                  if (p.domainId) purchasedDomainSet.add(p.domainId);
                  if (p.examId === result.data.exam?.id) hasExamPurchase = true;
                });
                
                setPurchasedTests(purchasedTestSet);
                setPurchasedDomains(purchasedDomainSet);
                setExamPurchased(hasExamPurchase);
              }
            } catch (e) {
              console.error('Error fetching purchases:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exam:', error);
      } finally {
        setLoading(false);
      }
    }
    if (params.slug) {
      fetchExamData();
    }
  }, [params.slug]);

  // Fetch tests when domain is selected
  const handleSelectDomain = async (domain) => {
    setSelectedDomain(domain);
    setTestsLoading(true);
    try {
      const response = await fetch(`/api/domains/${domain.id}`);
      const result = await response.json();
      if (result.success) {
        // Mock Tests page must show ONLY mock tests. Practice Questions and
        // Previous Year tests have their own dedicated flows.
        const all = result.data.tests || [];
        setTests(all.filter(t => !t.testType || t.testType === 'mock_test'));
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setTestsLoading(false);
    }
  };

  const handleBackToDomains = () => {
    setSelectedDomain(null);
    setTests([]);
  };

  const handleStartTest = async (test) => {
    const userData = localStorage.getItem('user');
    const isTestFree = test.isFree || !test.price || test.price === 0;
    const isDomainPurchased = purchasedDomains.has(selectedDomain?.id);
    
    // Free tests are always accessible
    if (isTestFree) {
      window.location.href = `/mock-test/${test.id}`;
      return;
    }
    
    // Check if already purchased (test, domain, or exam)
    if (purchasedTests.has(test.id) || isDomainPurchased || examPurchased) {
      window.location.href = `/mock-test/${test.id}`;
      return;
    }
    
    // Verify via API
    if (userData) {
      try {
        const checkRes = await fetch('/api/payment/verify-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ mockTestId: test.id, domainId: selectedDomain?.id, examId: exam?.id })
        });
        const checkData = await checkRes.json();
        if (checkData.success && checkData.data?.hasAccess) {
          window.location.href = `/mock-test/${test.id}`;
          return;
        }
      } catch (e) {
        console.error('Error checking access:', e);
      }
    }
    
    if (!userData) {
      alert('Please login to access this test');
      window.location.href = '/login';
      return;
    }
    
    // Show payment modal
    setSelectedTest(test);
    setShowUnlockModal(true);
  };

  const handlePayment = async (purchaseType) => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      alert('Please login to make payment');
      window.location.href = '/login';
      return;
    }

    let amount, paymentData;
    
    if (purchaseType === 'exam') {
      amount = exam.price;
      paymentData = { examId: exam.id, amount, paymentType: 'exam_purchase' };
    } else if (purchaseType === 'domain') {
      amount = selectedDomain.price;
      paymentData = { domainId: selectedDomain.id, examId: exam.id, amount, paymentType: 'domain_purchase' };
    } else {
      amount = selectedTest.price;
      paymentData = { mockTestId: selectedTest.id, amount, paymentType: 'test_purchase' };
    }

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        const { orderId, keyId, name, description, prefill } = result.data;
        
        const options = {
          key: keyId,
          amount: result.data.amount,
          currency: result.data.currency,
          name,
          description,
          order_id: orderId,
          prefill,
          theme: { color: '#14b8a6' },
          handler: async function (response) {
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                window.location.href = `/payment/success?txn=${response.razorpay_payment_id}`;
              } else {
                window.location.href = `/payment/failed?reason=${encodeURIComponent(verifyData.error)}`;
              }
            } catch (err) {
              window.location.href = `/payment/failed?reason=${encodeURIComponent(err.message)}`;
            }
          }
        };
        
        options['handler.failed'] = function (response) {
          window.location.href = `/payment/failed?reason=${encodeURIComponent(response.error.description)}`;
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert(result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
    
    setShowUnlockModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="pt-24 text-center">
          <p className="text-gray-500">Test series not found</p>
        </div>
      </div>
    );
  }

  // Render domain card
  const renderDomainCard = (domain) => {
    const isPurchased = purchasedDomains.has(domain.id) || examPurchased;
    const isFree = !domain.price || domain.price === 0;
    
    return (
      <Card key={domain.id} className="card-hover cursor-pointer" onClick={() => handleSelectDomain(domain)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
              <Layers className="w-7 h-7 text-white" />
            </div>
            {isPurchased ? (
              <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1 inline" /> Unlocked</Badge>
            ) : isFree ? (
              <Badge className="bg-green-100 text-green-700">FREE</Badge>
            ) : (
              <Badge className="bg-brand-100 text-brand-700">₹{domain.price}</Badge>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{domain.name}</h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{domain.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <ClipboardList className="w-4 h-4 inline mr-1" />
              {domain.testCount || 0} Tests
            </span>
            <ChevronRight className="w-5 h-5 text-brand-600" />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render test card
  const renderTestCard = (test) => {
    const isTestFree = test.isFree || !test.price || test.price === 0;
    const isTestPurchased = purchasedTests.has(test.id);
    const isDomainPurchased = purchasedDomains.has(selectedDomain?.id);
    const isAccessible = isTestFree || isTestPurchased || isDomainPurchased || examPurchased;
    
    return (
      <Card key={test.id} className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
              {test.testType === 'practice_questions' ? (
                <BookOpen className="w-6 h-6 text-brand-600" />
              ) : test.testType === 'previous_year' ? (
                <History className="w-6 h-6 text-purple-600" />
              ) : (
                <ClipboardList className="w-6 h-6 text-brand-600" />
              )}
            </div>
            {isTestPurchased || isDomainPurchased || examPurchased ? (
              <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1 inline" /> Unlocked</Badge>
            ) : isTestFree ? (
              <Badge className="bg-green-100 text-green-700">FREE</Badge>
            ) : (
              <Badge className="bg-brand-100 text-brand-700">₹{test.price}</Badge>
            )}
          </div>
          <h3 className="font-bold text-gray-900 mb-2">{test.title}</h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{test.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {test.duration} min
            </span>
            <span>{test.questionCount || test.totalQuestions} Qs</span>
          </div>
          <Button 
            className="w-full bg-brand-600 hover:bg-brand-700"
            onClick={() => handleStartTest(test)}
          >
            {isAccessible ? (
              <><Play className="w-4 h-4 mr-2" /> Start Test</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" /> Unlock & Start</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      {/* Hero Section */}
      <div className="pt-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {selectedDomain ? (
            <button 
              onClick={handleBackToDomains}
              className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Domains
            </button>
          ) : (
            <Link href="/exams" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Test Series
            </Link>
          )}
          
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <Trophy className="w-10 h-10 text-brand-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedDomain ? `${exam.name} - ${selectedDomain.name}` : exam.name}
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedDomain ? selectedDomain.description : `Select a domain to view available tests`}
              </p>
              {!selectedDomain && domains.length > 0 && (
                <p className="text-sm text-brand-600 mt-2">
                  <Layers className="w-4 h-4 inline mr-1" />
                  {domains.length} domains available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {!selectedDomain ? (
          // Show domains
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select a Domain</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domains.map(renderDomainCard)}
            </div>
            {domains.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No domains available yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Show tests in domain
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Tests in {selectedDomain.name}
            </h2>
            {testsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map(renderTestCard)}
              </div>
            )}
            {!testsLoading && tests.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tests available in this domain yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Unlock Test</DialogTitle>
            <DialogDescription>Choose how you want to access this test</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedTest && (
              <>
                {/* Individual Test Purchase */}
                <div className="border-2 border-brand-500 rounded-lg p-4 bg-brand-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">This Test Only</h4>
                    <span className="text-xl font-bold text-brand-600">₹{selectedTest.price || 0}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{selectedTest.title}</p>
                  <Button 
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    onClick={() => handlePayment('test')}
                  >
                    Pay ₹{selectedTest.price || 0} for Test
                  </Button>
                </div>

                {/* Domain Purchase Option */}
                {selectedDomain?.price > 0 && !purchasedDomains.has(selectedDomain.id) && (
                  <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">Full Domain Access</h4>
                        <Badge className="bg-blue-200 text-blue-800 text-xs">Recommended</Badge>
                      </div>
                      <span className="text-xl font-bold text-blue-600">₹{selectedDomain.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{selectedDomain.name} - All Tests</p>
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      onClick={() => handlePayment('domain')}
                    >
                      Pay ₹{selectedDomain.price} for Domain
                    </Button>
                  </div>
                )}

                {/* Exam Purchase Option */}
                {exam?.price > 0 && !examPurchased && (
                  <div className="border-2 border-amber-400 rounded-lg p-4 bg-amber-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">Full Test Series Access</h4>
                        <Badge className="bg-amber-200 text-amber-800 text-xs">Best Value</Badge>
                      </div>
                      <span className="text-xl font-bold text-amber-600">₹{exam.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{exam.name} - All Domains & Tests</p>
                    <Button 
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => handlePayment('exam')}
                    >
                      Pay ₹{exam.price} for Full Test Series
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
