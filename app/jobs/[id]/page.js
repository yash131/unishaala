'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  Users,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="default" showText={false} />
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-rose-600 text-rose-600">Login</Button>
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

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setJob(result.data);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-20 bg-gradient-to-b from-rose-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Link href="/jobs" className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-10 h-10 text-rose-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-rose-600 font-medium mb-4">{job.organization}</p>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {job.vacancies} Vacancies
                </span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" /> {job.salary}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Badge className="bg-green-100 text-green-700 text-sm px-4 py-2">
                Active
              </Badge>
              <Badge className="bg-rose-100 text-rose-700 text-sm px-4 py-2">
                Last Date: {job.lastDate}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{job.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Qualification</p>
                      <p className="font-medium">{job.qualification}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <IndianRupee className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Salary Range</p>
                      <p className="font-medium">{job.salary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Total Vacancies</p>
                      <p className="font-medium">{job.vacancies}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Criteria</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">{job.qualification}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">Age limit as per government norms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-600">Indian citizenship required</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Apply Now</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Application Deadline</span>
                    <span className="font-medium text-rose-600">{job.lastDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Application Fee</span>
                    <span className="font-medium">Varies by category</span>
                  </div>
                </div>
                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6">
                  Apply Online <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  You will be redirected to official website
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
