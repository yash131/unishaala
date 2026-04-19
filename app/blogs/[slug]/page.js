'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MainNavbar } from '@/components/MainNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Eye, Share2, FileText } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function readTime(html = '') {
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blogs/${slug}`);
        const d = await res.json();
        if (d.success) {
          setBlog(d.data);
        } else {
          setNotFound(true);
        }
        // Fetch related posts
        const all = await fetch('/api/blogs').then(r => r.json());
        if (all.success) {
          setRelated((all.data || []).filter(b => b.slug !== slug).slice(0, 3));
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: blog?.title, url });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
        <MainNavbar />
        <div className="flex justify-center pt-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
        <MainNavbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h1>
          <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link href="/blogs">
            <Button className="bg-teal-600 hover:bg-teal-700">Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
      <MainNavbar />

      <article className="pt-20">
        {/* Hero */}
        <div className="relative">
          {blog.image ? (
            <div className="relative h-64 md:h-96 overflow-hidden">
              <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-r from-teal-100 via-white to-rose-100"></div>
          )}
        </div>

        <div className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-10 pb-16">
          <div className="max-w-3xl mx-auto">
            <Link href="/blogs" className="inline-flex items-center text-white mb-4 hover:text-teal-200 transition-colors drop-shadow">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Articles
            </Link>

            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur">
              <CardContent className="p-6 md:p-10">
                <Badge className="bg-teal-100 text-teal-700 mb-4">Blog</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {blog.title}
                </h1>

                {blog.description && (
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">{blog.description}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDate(blog.publishDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {readTime(blog.content)}
                    </span>
                    {typeof blog.views === 'number' && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {blog.views} views
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" /> {copied ? 'Link copied!' : 'Share'}
                  </Button>
                </div>

                {/* Content */}
                <div
                  className="blog-content prose prose-teal max-w-none"
                  dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                />
              </CardContent>
            </Card>

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {related.map((r) => (
                    <Link key={r.id} href={`/blogs/${r.slug}`} className="group">
                      <Card className="overflow-hidden h-full border-0 shadow-md hover:shadow-xl transition-all bg-white/80 backdrop-blur">
                        <div className="h-32 overflow-hidden bg-gradient-to-br from-teal-100 to-rose-100">
                          {r.image ? (
                            <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-10 h-10 text-teal-400" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-500 mb-1">{formatDate(r.publishDate)}</p>
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
                            {r.title}
                          </h3>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      <style jsx global>{`
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
          font-weight: 700;
          color: #111827;
          margin-top: 1.5em;
          margin-bottom: 0.6em;
          line-height: 1.3;
        }
        .blog-content h1 { font-size: 2em; }
        .blog-content h2 { font-size: 1.5em; }
        .blog-content h3 { font-size: 1.25em; }
        .blog-content p { margin-bottom: 1em; color: #374151; line-height: 1.75; font-size: 1.05rem; }
        .blog-content a { color: #0d9488; text-decoration: underline; }
        .blog-content a:hover { color: #0f766e; }
        .blog-content ul, .blog-content ol { margin: 1em 0; padding-left: 1.5em; }
        .blog-content ul { list-style: disc; }
        .blog-content ol { list-style: decimal; }
        .blog-content li { margin-bottom: 0.4em; color: #374151; line-height: 1.75; }
        .blog-content blockquote {
          border-left: 4px solid #14b8a6;
          padding: 0.5em 1em;
          margin: 1em 0;
          color: #4b5563;
          background: #f0fdfa;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
        }
        .blog-content img { max-width: 100%; border-radius: 0.75rem; margin: 1.25em 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .blog-content code { background: #f3f4f6; padding: 0.15em 0.35em; border-radius: 0.25em; font-size: 0.95em; color: #be185d; }
        .blog-content pre { background: #0f172a; color: #e2e8f0; padding: 1em; border-radius: 0.5em; overflow-x: auto; margin: 1em 0; }
        .blog-content pre code { background: transparent; color: inherit; padding: 0; }
        .blog-content strong { font-weight: 700; color: #111827; }
        .blog-content em { font-style: italic; }
        .blog-content u { text-decoration: underline; }
      `}</style>
    </div>
  );
}
