'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, ArrowRight, Search, FileText, Clock } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(html = '') {
  const words = stripHtml(html).split(' ').filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/blogs');
        const d = await res.json();
        if (d.success) {
          setBlogs(d.data || []);
          setFiltered(d.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const s = search.trim().toLowerCase();
    if (!s) {
      setFiltered(blogs);
      return;
    }
    setFiltered(
      blogs.filter(b =>
        (b.title || '').toLowerCase().includes(s) ||
        (b.description || '').toLowerCase().includes(s)
      )
    );
  }, [search, blogs]);

  const hero = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
      <MainNavbar />

      {/* Hero Header */}
      <section className="pt-24 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-brand-200/40 blur-3xl"></div>
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-brand-200/40 blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <Badge className="bg-brand-100 text-brand-700 mb-3">Unishaala Blog</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Insights, Tips & <span className="text-brand-600">Study Guides</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Stay ahead with expert articles on exam strategies, study techniques, and career guidance.
            </p>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search articles..."
                className="pl-10 h-12 bg-white/80 backdrop-blur border-gray-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="max-w-xl mx-auto border-dashed">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No articles yet</h3>
              <p className="text-gray-500">
                {search ? 'Try a different keyword.' : 'Check back soon for fresh content.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Featured Post */}
            {hero && !search && (
              <Link href={`/blogs/${hero.slug}`} className="block mb-10 group">
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/70 backdrop-blur">
                  <div className="grid md:grid-cols-2">
                    <div className="relative h-64 md:h-auto overflow-hidden bg-gradient-to-br from-brand-100 to-brand-100">
                      {hero.image ? (
                        <img
                          src={hero.image}
                          alt={hero.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-20 h-20 text-brand-400" />
                        </div>
                      )}
                      <Badge className="absolute top-4 left-4 bg-brand-500 text-white">Featured</Badge>
                    </div>
                    <CardContent className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {formatDate(hero.publishDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {readTime(hero.content)}
                        </span>
                        {typeof hero.views === 'number' && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {hero.views}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">
                        {hero.title}
                      </h2>
                      <p className="text-gray-600 mb-6 line-clamp-3">
                        {hero.description || stripHtml(hero.content).slice(0, 180)}
                      </p>
                      <div className="inline-flex items-center text-brand-600 font-semibold">
                        Read full article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(search ? filtered : rest).map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`} className="group">
                  <Card className="overflow-hidden h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur hover:-translate-y-1">
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-brand-100 to-brand-100">
                      {blog.image ? (
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-14 h-14 text-brand-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(blog.publishDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {readTime(blog.content)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {blog.description || stripHtml(blog.content).slice(0, 140)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center text-sm text-brand-600 font-medium">
                          Read more <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                        {blog.pdfFileId && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2 py-0.5">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
