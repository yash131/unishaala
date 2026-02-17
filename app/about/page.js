'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MainNavbar } from '@/components/MainNavbar';
import {
  Target,
  Users,
  Trophy,
  BookOpen,
  CheckCircle,
  Star
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { number: '500K+', label: 'Students' },
    { number: '10K+', label: 'Mock Tests' },
    { number: '50+', label: 'Exams' },
    { number: '95%', label: 'Success Rate' }
  ];

  const values = [
    { icon: <Target className="w-8 h-8" />, title: 'Mission', desc: 'To democratize quality education and make exam preparation accessible to every student in India.' },
    { icon: <BookOpen className="w-8 h-8" />, title: 'Quality Content', desc: 'Expert-curated study materials, previous year papers, and mock tests designed by top educators.' },
    { icon: <Trophy className="w-8 h-8" />, title: 'Proven Results', desc: 'Thousands of students have achieved their dream ranks using our comprehensive preparation platform.' }
  ];

  const team = [
    { name: 'Dr. Rajesh Kumar', role: 'Founder & CEO', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Priya Sharma', role: 'Head of Content', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Amit Singh', role: 'CTO', image: 'https://randomuser.me/api/portraits/men/67.jpg' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-20 bg-gradient-to-b from-teal-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-teal-600">Unishaala</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              We are on a mission to transform the way students prepare for competitive exams. 
              Our platform provides comprehensive study materials, mock tests, and personalized 
              learning paths to help every student achieve their dreams.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-teal-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</p>
                <p className="text-teal-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="card-hover text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Unishaala?</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {[
                'Comprehensive study materials for 50+ competitive exams',
                'Expert-designed mock tests with detailed solutions',
                'Previous year papers with topic-wise analysis',
                'Handwritten notes from top rankers',
                'AI-powered rank predictor and college finder',
                'Affordable pricing with free trial access',
                'Mobile-friendly platform for learning on the go',
                '24/7 doubt resolution support'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="card-hover text-center">
                <CardContent className="p-6">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-bold text-gray-900">{member.name}</h3>
                  <p className="text-teal-600">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have achieved their dreams with Unishaala.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/exams">
              <Button size="lg" variant="outline" className="bg-white text-teal-600 hover:bg-gray-100">
                Explore Exams
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
