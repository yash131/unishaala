'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Logo, LogoIcon } from '@/components/Logo';
import { 
  GraduationCap, 
  FileText, 
  Trophy, 
  Users, 
  Bell, 
  Briefcase, 
  Building, 
  Star, 
  ChevronRight, 
  Search,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  BookOpen,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';

// Navbar Component
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/exams', label: 'Exams' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/rank-predictor', label: 'Rank Predictor' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="default" showText={false} />

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                Sign Up
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="block py-2 text-gray-700 hover:text-teal-600"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-4">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full border-teal-600 text-teal-600">Login</Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <Button className="w-full bg-rose-500 hover:bg-rose-600">Sign Up</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="pt-20 bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-teal-100 text-teal-700 mb-4">India's #1 Exam Preparation Platform</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Crack Your Dream Exam with <span className="text-teal-600">Unishaala</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Access thousands of mock tests, previous year papers, and expert-curated study materials for GATE, CAT, UPSC, JEE and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/exams">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
                  Explore Exams <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">500K+</p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">10K+</p>
                <p className="text-sm text-gray-600">Mock Tests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">50+</p>
                <p className="text-sm text-gray-600">Exams</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-teal-100 rounded-3xl p-4 overflow-hidden">
              <img 
                src="https://customer-assets.emergentagent.com/job_7acc3893-d2c4-4511-8e86-2a2521e5fe9d/artifacts/harwama0_banner_%20finsl.png" 
                alt="UPPSC Full Length Test - Unishaala" 
                className="rounded-2xl shadow-xl w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">95% Success Rate</p>
                  <p className="text-sm text-gray-500">In Top Exams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Exam Notifications Section
function ExamNotifications({ notifications }) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Exam Notifications</h2>
            <p className="text-gray-600 mt-2">Stay updated with latest exam announcements</p>
          </div>
          <Link href="/notifications">
            <Button variant="outline" className="hidden md:flex">
              View All <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {notifications?.map((notif) => (
            <Card key={notif.id} className="card-hover border-l-4 border-l-teal-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                    {notif.examName}
                  </Badge>
                  {notif.isNew && (
                    <Badge className="bg-rose-500 text-white text-xs">NEW</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{notif.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {notif.date}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Popular Exams Section
function PopularExams({ exams }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Popular Exams</h2>
          <p className="text-gray-600 mt-2">Choose from 50+ competitive exams</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {exams?.slice(0, 8).map((exam) => (
            <Link key={exam.id} href={`/exams/${exam.slug}`}>
              <Card className="card-hover text-center h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                    {exam.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{exam.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{exam.category}</p>
                  <div className="flex justify-center gap-4 text-xs text-gray-500">
                    <span>{exam.totalTests} Tests</span>
                    <span>{exam.totalQuestions} Qs</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/exams">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
              View All Exams <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    { icon: <FileText className="w-8 h-8" />, title: 'Mock Tests', desc: '10,000+ practice tests with detailed analytics', color: 'bg-blue-100 text-blue-600' },
    { icon: <BookOpen className="w-8 h-8" />, title: 'Question Bank', desc: 'Topic-wise questions with explanations', color: 'bg-green-100 text-green-600' },
    { icon: <Target className="w-8 h-8" />, title: 'Previous Papers', desc: '10+ years of solved papers', color: 'bg-purple-100 text-purple-600' },
    { icon: <Trophy className="w-8 h-8" />, title: 'Topper Notes', desc: 'Handwritten notes from top rankers', color: 'bg-orange-100 text-orange-600' }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose Unishaala?</h2>
          <p className="text-gray-600 mt-2">Everything you need to crack your dream exam</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover border-none shadow-md">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// College Finder Section
function CollegeFinder({ colleges }) {
  return (
    <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">College Finder</h2>
          <p className="text-teal-100 mt-2">Find the best colleges based on your rank</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {colleges?.slice(0, 4).map((college) => (
            <Card key={college.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-teal-600" />
                  <Badge variant="secondary">Rank #{college.ranking}</Badge>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{college.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{college.location}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{college.type}</span>
                  <span className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" /> {college.rating}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/colleges">
            <Button size="lg" variant="secondary" className="bg-white text-teal-600 hover:bg-gray-100">
              Explore All Colleges <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Job Notifications Section
function JobNotifications({ jobs }) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Latest Job Notifications</h2>
            <p className="text-gray-600 mt-2">Government & Private sector opportunities</p>
          </div>
          <Link href="/jobs">
            <Button variant="outline" className="hidden md:flex">
              View All Jobs <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {jobs?.slice(0, 3).map((job) => (
            <Card key={job.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-teal-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">{job.vacancies} Posts</Badge>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-sm text-teal-600 font-medium mb-3">{job.organization}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</p>
                  <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> Last Date: {job.lastDate}</p>
                </div>
                <Link href={`/jobs/${job.id}`}>
                  <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection({ testimonials }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Success Stories</h2>
          <p className="text-gray-600 mt-2">Hear from our successful students</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials?.map((item) => (
            <Card key={item.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-teal-600">{item.exam}</p>
                    <Badge className="bg-yellow-100 text-yellow-700 mt-1">{item.rank}</Badge>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{item.testimonial}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="mb-4">
              <Logo size="default" showText={false} />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Your trusted partner for competitive exam preparation. Join millions of students achieving their dreams.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/exams" className="hover:text-teal-600">Exams</Link></li>
              <li><Link href="/jobs" className="hover:text-teal-600">Jobs</Link></li>
              <li><Link href="/rank-predictor" className="hover:text-teal-600">Rank Predictor</Link></li>
              <li><Link href="/colleges" className="hover:text-teal-600">College Finder</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Popular Exams</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/exams/gate" className="hover:text-teal-600">GATE</Link></li>
              <li><Link href="/exams/cat" className="hover:text-teal-600">CAT</Link></li>
              <li><Link href="/exams/upsc" className="hover:text-teal-600">UPSC</Link></li>
              <li><Link href="/exams/jee-main" className="hover:text-teal-600">JEE Main</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                support@unishaala.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-600" />
                +91 1234567890
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2025 Unishaala. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Main Home Page
export default function HomePage() {
  const [data, setData] = useState({
    exams: [],
    notifications: [],
    testimonials: [],
    jobs: [],
    colleges: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/home');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ExamNotifications notifications={data.notifications} />
      <PopularExams exams={data.exams} />
      <FeaturesSection />
      <CollegeFinder colleges={data.colleges} />
      <JobNotifications jobs={data.jobs} />
      <TestimonialsSection testimonials={data.testimonials} />
      <Footer />
    </div>
  );
}
