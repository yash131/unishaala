'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Trophy,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  BarChart3,
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function TestResultPage() {
  const params = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const response = await fetch(`/api/attempt/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setResult(data.data);
        }
      } catch (error) {
        console.error('Error fetching result:', error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Result not found</p>
      </div>
    );
  }

  const { attempt, questions } = result;
  const percentage = ((attempt.score / attempt.totalMarks) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-teal-700">Unishaala</span>
            </Link>
            <Link href="/exams">
              <Button variant="outline" className="border-teal-600 text-teal-600">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Exams
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Result Summary */}
        <Card className="mb-8 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-8 text-white">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Trophy className="w-12 h-12" />
              <h1 className="text-3xl font-bold">Test Completed!</h1>
            </div>
            <p className="text-teal-100 text-center">Here's how you performed</p>
          </div>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-teal-50 rounded-xl">
                <p className="text-4xl font-bold text-teal-600">{attempt.score.toFixed(1)}</p>
                <p className="text-gray-600">Score</p>
                <p className="text-sm text-gray-400">out of {attempt.totalMarks}</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <p className="text-4xl font-bold text-blue-600">{percentage}%</p>
                <p className="text-gray-600">Percentage</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <p className="text-4xl font-bold text-green-600">{attempt.correct || 0}</p>
                <p className="text-gray-600">Correct</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <p className="text-4xl font-bold text-red-600">{attempt.incorrect || 0}</p>
                <p className="text-gray-600">Incorrect</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Performance</span>
                <span>{percentage}%</span>
              </div>
              <Progress value={parseFloat(percentage)} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis */}
        <Tabs defaultValue="solutions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow rounded-lg h-14">
            <TabsTrigger value="solutions" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <FileText className="w-4 h-4 mr-2" /> Solutions
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" /> Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solutions">
            <div className="space-y-4">
              {questions.map((q, index) => {
                const userAnswer = attempt.answers?.[q.id];
                const isCorrect = userAnswer === q.correctOption;
                const isUnanswered = userAnswer === undefined || userAnswer === null;

                return (
                  <Card key={q.id} className="shadow-sm">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isUnanswered ? 'bg-gray-100' : isCorrect ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {isUnanswered ? (
                              <MinusCircle className="w-5 h-5 text-gray-500" />
                            ) : isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">Q{index + 1}</Badge>
                              {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                            </div>
                            <p className="text-gray-900">{q.questionText}</p>
                          </div>
                        </div>
                        {expandedQuestion === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                    
                    {expandedQuestion === index && (
                      <CardContent className="pt-0">
                        <div className="ml-14 space-y-4">
                          <div className="space-y-2">
                            {q.options?.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border ${
                                  optIndex + 1 === q.correctOption
                                    ? 'border-green-500 bg-green-50'
                                    : optIndex + 1 === userAnswer && !isCorrect
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-700">{option}</span>
                                  {optIndex + 1 === q.correctOption && (
                                    <Badge className="bg-green-500">Correct</Badge>
                                  )}
                                  {optIndex + 1 === userAnswer && optIndex + 1 !== q.correctOption && (
                                    <Badge className="bg-red-500">Your Answer</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {q.solution && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-900 mb-2">Solution</h4>
                              <p className="text-blue-800">{q.solution}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Analysis</h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Question Breakdown</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" /> Correct
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={(attempt.correct / questions.length) * 100} className="w-32 h-2" />
                          <span className="font-medium">{attempt.correct || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" /> Incorrect
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={(attempt.incorrect / questions.length) * 100} className="w-32 h-2" />
                          <span className="font-medium">{attempt.incorrect || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MinusCircle className="w-5 h-5 text-gray-500" /> Unanswered
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={(attempt.unanswered / questions.length) * 100} className="w-32 h-2" />
                          <span className="font-medium">{attempt.unanswered || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Recommendations</h4>
                    <ul className="space-y-3">
                      {parseFloat(percentage) >= 80 ? (
                        <li className="flex items-start gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5 mt-0.5" />
                          <span>Excellent performance! Keep up the good work.</span>
                        </li>
                      ) : parseFloat(percentage) >= 60 ? (
                        <li className="flex items-start gap-2 text-yellow-700">
                          <Clock className="w-5 h-5 mt-0.5" />
                          <span>Good attempt! Focus on weak areas to improve further.</span>
                        </li>
                      ) : (
                        <li className="flex items-start gap-2 text-red-700">
                          <XCircle className="w-5 h-5 mt-0.5" />
                          <span>Needs improvement. Review the solutions carefully.</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2 text-gray-600">
                        <FileText className="w-5 h-5 mt-0.5" />
                        <span>Practice more questions from the question bank</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
