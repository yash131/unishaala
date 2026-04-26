'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Logo, LogoIcon } from '@/components/Logo';
import { MainNavbar } from '@/components/MainNavbar';
import AccessGateBanner from '@/components/AccessGateBanner';
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

// Hero Section
function HeroSection() {
  return (
    <section className="pt-20 bg-gradient-to-b from-brand-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-brand-100 text-brand-700 mb-4">India's #1 Exam Preparation Platform</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Crack Your Dream Exam with <span className="text-brand-600">Unishaala</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Access thousands of mock tests, previous year papers, and expert-curated study materials for GATE, ESE, PSUs, State AE/JE in Civil Engineering and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/exams">
                <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white w-full sm:w-auto">
                  Explore Exams <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-brand-500 text-brand-500 hover:bg-brand-50 w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600">500K+</p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600">10K+</p>
                <p className="text-sm text-gray-600">Mock Tests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600">50+</p>
                <p className="text-sm text-gray-600">Exams</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-brand-100 rounded-3xl p-4 overflow-hidden">
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
                  <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                    {notif.examName}
                  </Badge>
                  {notif.isNew && (
                    <Badge className="bg-brand-500 text-white text-xs">NEW</Badge>
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
                  <div className="w-16 h-16 mx-auto bg-brand-100 rounded-full flex items-center justify-center mb-4 text-3xl">
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
            <Button size="lg" className="bg-brand-600 hover:bg-brand-700">
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

// Blog Marquee Section (auto-scrolling horizontal blog cards)
function BlogMarquee({ blogs }) {
  if (!blogs || blogs.length === 0) return null;

  // Duplicate for seamless infinite loop
  const items = [...blogs, ...blogs];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge className="bg-brand-100 text-brand-700 mb-3">Latest Articles</Badge>
          <h2 className="text-3xl font-bold text-gray-900">From Our Blog</h2>
          <p className="text-gray-600 mt-2">Insights, tips and updates to power your prep</p>
        </div>
      </div>

      <div className="marquee-wrapper marquee-fade overflow-hidden">
        <div className="marquee-track gap-6 py-4">
          {items.map((blog, idx) => (
            <Link
              key={`${blog.id}-${idx}`}
              href={`/blogs/${blog.slug}`}
              className="block flex-shrink-0 w-[320px]"
            >
              <Card className="card-hover h-full overflow-hidden">
                <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-brand-600" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    {blog.publishDate
                      ? new Date(blog.publishDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : ''}
                    {typeof blog.views === 'number' && (
                      <>
                        <span>·</span>
                        <span>{blog.views} views</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>
                  {blog.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {blog.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center text-sm font-medium text-brand-600">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 text-center">
        <Link href="/blogs">
          <Button size="lg" variant="outline" className="border-brand-500 text-brand-600 hover:bg-brand-50">
            View All Articles <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
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
                  <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-brand-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">{job.vacancies} Posts</Badge>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-sm text-brand-600 font-medium mb-3">{job.organization}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</p>
                  <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> Last Date: {job.lastDate}</p>
                </div>
                <Link href={`/jobs/${job.id}`}>
                  <Button className="w-full mt-4 bg-brand-600 hover:bg-brand-700">View Details</Button>
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
                    <p className="text-sm text-brand-600">{item.exam}</p>
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
              Your trusted partner for competitive test series preparation. Join millions of students achieving their dreams.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 hover:bg-brand-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 hover:bg-brand-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 hover:bg-brand-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 hover:bg-brand-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/exams" className="hover:text-brand-600">Test Series</Link></li>
              <li><Link href="/blogs" className="hover:text-brand-600">Blogs</Link></li>
              <li><Link href="/jobs" className="hover:text-brand-600">Jobs</Link></li>
              <li><Link href="/rank-predictor" className="hover:text-brand-600">Rank Predictor</Link></li>
              <li><Link href="/colleges" className="hover:text-brand-600">College Finder</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Popular Test Series</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/exams/gate" className="hover:text-brand-600">GATE</Link></li>
              <li><Link href="/exams/cat" className="hover:text-brand-600">CAT</Link></li>
              <li><Link href="/exams/upsc" className="hover:text-brand-600">UPSC</Link></li>
              <li><Link href="/exams/jee-main" className="hover:text-brand-600">JEE Main</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600" />
                support@unishaala.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600" />
                +91 1234567890
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2025 Unishaala. All rights reserved.</p>
          <p className="mt-2 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
            <span className="mx-2">•</span>
            <Link href="/terms-of-service" className="hover:text-gray-600">Terms & Conditions</Link>
            <span className="mx-2">•</span>
            <Link href="/refund-policy" className="hover:text-gray-600">Refund Policy</Link>
          </p>
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
    colleges: [],
    blogs: []
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
      <div className="min-h-screen">
        <AccessGateBanner />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MainNavbar />
      <AccessGateBanner />
      <HeroSection />
      <ExamNotifications notifications={data.notifications} />
      <PopularExams exams={data.exams} />
      <FeaturesSection />
      <BlogMarquee blogs={data.blogs} />
      <JobNotifications jobs={data.jobs} />
      <TestimonialsSection testimonials={data.testimonials} />
      <Footer />
    </div>
  );
}