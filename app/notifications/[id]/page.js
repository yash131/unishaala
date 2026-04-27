'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Loader2, Bell, Clock, ExternalLink, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`/api/notifications/${id}`);
        const d = await r.json();
        if (d.success) setNotif(d.data);
        else setNotFound(true);
      } catch (_e) {
        toast.error('Failed to load notification');
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 via-white to-white">
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link href="/notifications" className="text-sm text-gray-600 hover:text-brand-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> All Notifications
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : notFound || !notif ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-700">Notification not found</h3>
              <p className="text-sm text-gray-500 mt-1">This notification may have been removed.</p>
              <Link href="/notifications"><Button className="mt-4 bg-brand-600 hover:bg-brand-700">View all notifications</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {notif.examName && <Badge className="bg-brand-600">{notif.examName}</Badge>}
                {notif.isNew && <Badge className="bg-green-500">NEW</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{notif.title}</h1>
              {notif.date && (
                <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {notif.date}
                </p>
              )}
              <div className="mt-6 border-t pt-6">
                {notif.description ? (
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{notif.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No additional details provided.</p>
                )}
              </div>
              {notif.link && notif.link !== '#' && (
                <div className="mt-8">
                  <a href={notif.link} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-brand-600 hover:bg-brand-700">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open official link
                    </Button>
                  </a>
                </div>
              )}
              <div className="mt-8 pt-6 border-t">
                <Link href="/notifications">
                  <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to all notifications</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
