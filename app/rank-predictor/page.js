'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MainNavbar } from '@/components/MainNavbar';
import {
  Target,
  TrendingUp,
  Building,
  Loader2,
  ChevronRight
} from 'lucide-react';

export default function RankPredictorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    exam: '',
    score: '',
    totalMarks: '100'
  });

  const exams = [
    { slug: 'gate', name: 'GATE', totalMarks: 100 },
    { slug: 'cat', name: 'CAT', totalMarks: 300 },
    { slug: 'jee-main', name: 'JEE Main', totalMarks: 300 },
    { slug: 'neet', name: 'NEET', totalMarks: 720 },
    { slug: 'upsc', name: 'UPSC Prelims', totalMarks: 200 }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/rank-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSlug: formData.exam,
          score: parseFloat(formData.score),
          totalMarks: parseFloat(formData.totalMarks)
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Error predicting rank:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (value) => {
    const exam = exams.find(e => e.slug === value);
    setFormData({
      ...formData,
      exam: value,
      totalMarks: exam?.totalMarks.toString() || '100'
    });
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      <div className="pt-20 pb-12 bg-gradient-to-b from-teal-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Rank Predictor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Enter your expected score to get an estimated rank range and college recommendations based on previous year data.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Enter Your Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Exam</Label>
                    <Select value={formData.exam} onValueChange={handleExamChange}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose an exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.map((exam) => (
                          <SelectItem key={exam.slug} value={exam.slug}>
                            {exam.name} (Total: {exam.totalMarks})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Expected Score</Label>
                    <Input
                      type="number"
                      placeholder="Enter your score"
                      className="h-12"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Marks</Label>
                    <Input
                      type="number"
                      className="h-12 bg-gray-50"
                      value={formData.totalMarks}
                      readOnly
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-lg"
                    disabled={loading || !formData.exam || !formData.score}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Predict My Rank'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className={`shadow-lg transition-all ${result ? 'opacity-100' : 'opacity-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-teal-600" />
                  Prediction Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">Your Score Percentage</p>
                      <p className="text-4xl font-bold text-teal-600">
                        {result.percentage.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">Expected Rank Range</p>
                      <p className="text-3xl font-bold text-rose-600">
                        {result.rankRange.min.toLocaleString()} - {result.rankRange.max.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900 mb-3">Recommended Colleges</p>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <ChevronRight className="w-4 h-4 text-teal-600" />
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      * This is an estimated prediction based on previous year data. Actual ranks may vary.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Enter your details to see rank prediction</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
