'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import {
  GraduationCap,
  Search,
  Menu,
  X,
  Briefcase,
  MapPin,
  Clock,
  Building,
  IndianRupee,
  Users,
  Filter,
  ArrowRight
} from 'lucide-react';

function Navbar() {
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
        </div>
      </div>
    </nav>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = ['All', 'Teaching', 'Technical', 'Banking', 'Government', 'Railways'];

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch('/api/jobs');
        const result = await response.json();
        if (result.success) {
          setJobs(result.data);
          setFilteredJobs(result.data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;
    
    if (search) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.organization.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category && category !== 'all') {
      filtered = filtered.filter(job => job.category === category);
    }
    
    setFilteredJobs(filtered);
  }, [search, category, jobs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-12 bg-gradient-to-b from-teal-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Notifications</h1>
          <p className="text-gray-600 mb-8">Find the latest government and private sector job opportunities</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search jobs by title or organization..."
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-teal-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">{job.vacancies} Posts</Badge>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-teal-600 font-medium mb-4">{job.organization}</p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-gray-400" /> {job.salary}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Last Date: {job.lastDate}
                  </div>
                </div>

                <Badge variant="secondary" className="mb-4">{job.category}</Badge>

                <Link href={`/jobs/${job.id}`}>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    View Details <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
