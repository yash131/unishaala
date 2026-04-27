'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Loader2, Bell, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/notifications');
        const d = await r.json();
        if (d.success) setItems(d.data || []);
      } catch (_e) { toast.error('Failed to load notifications'); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 via-white to-white">
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand-600" /> Exam Notifications
          </h1>
          <p className="text-gray-600 mt-2">All the latest exam announcements and updates in one place.</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((n) => (
              <Link key={n.id} href={`/notifications/${n.id}`}>
                <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition cursor-pointer mb-4">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {n.examName && <Badge variant="secondary" className="bg-brand-100 text-brand-700">{n.examName}</Badge>}
                        {n.isNew && <Badge className="bg-brand-500 text-white text-xs">NEW</Badge>}
                      </div>
                      <h3 className="font-bold text-gray-900">{n.title}</h3>
                      {n.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{n.description}</p>}
                      {n.date && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {n.date}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
