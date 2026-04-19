'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainNavbar } from '@/components/MainNavbar';
import {
  Search,
  FileText,
  Users,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = ['All', 'Engineering', 'Management', 'Civil Services', 'Medical', 'Government', 'Banking', 'Railways'];

  useEffect(() => {
    async function fetchExams() {
      try {
        const response = await fetch('/api/exams');
        const result = await response.json();
        if (result.success) {
          setExams(result.data);
          setFilteredExams(result.data);
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  useEffect(() => {
    let filtered = exams;
    
    if (search) {
      filtered = filtered.filter(exam =>
        exam.name.toLowerCase().includes(search.toLowerCase()) ||
        exam.fullName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category && category !== 'all') {
      filtered = filtered.filter(exam => exam.category === category);
    }
    
    setFilteredExams(filtered);
  }, [search, category, exams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="pt-20 pb-12 bg-gradient-to-b from-teal-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">All Test Series</h1>
          <p className="text-gray-600 mb-8">Choose from 50+ competitive test series and start your preparation</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search test series..."
                className="pl-10 h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.slice(1).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="card-hover h-full">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                  {exam.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{exam.name}</h3>
                <p className="text-sm text-teal-600 font-medium mb-2">{exam.fullName}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{exam.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" /> {exam.totalTests} Tests
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {exam.totalQuestions} Qs
                  </span>
                </div>
                
                <Badge className="bg-teal-100 text-teal-700 mb-4">{exam.category}</Badge>
                
                <Link href={`/exams/${exam.slug}`}>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    Explore <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No test series found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
