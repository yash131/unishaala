'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MainNavbar } from '@/components/MainNavbar';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        toast.success('Message sent successfully!');
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: <Mail className="w-6 h-6" />, title: 'Email', value: 'support@unishaala.com', href: 'mailto:support@unishaala.com' },
    { icon: <Phone className="w-6 h-6" />, title: 'Phone', value: '+91 98291 32906', href: 'tel:+919829132906' },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26L4.45 19.34l3.5-1.16zm5.391-1.548c-.298 0-3.119-.058-5.717-2.633-2.875-2.85-2.654-6.243-2.59-6.696.063-.453.85-2.633 2.062-2.776.226-.027.45-.04.67-.04.27 0 .487.034.696.518.234.555.794 1.92.864 2.06.07.14.117.303.023.484-.094.182-.14.292-.281.45-.14.158-.296.353-.422.474-.14.135-.286.282-.123.554.164.273.728 1.2 1.564 1.946 1.073.96 1.978 1.255 2.252 1.395.273.14.432.117.59-.07.158-.187.682-.795.864-1.068.182-.273.364-.227.61-.137.247.09 1.572.741 1.84.875.27.135.45.202.516.314.067.114.067.66-.156 1.298-.225.638-1.31 1.243-1.838 1.32-.473.07-1.083.099-1.621-.103z"/>
        </svg>
      ),
      title: 'WhatsApp',
      value: '+91 98291 32906',
      href: 'https://wa.me/919829132906'
    },
    { icon: <MapPin className="w-6 h-6" />, title: 'Address', value: 'New Delhi, India', href: '#' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      <div className="pt-20 pb-12 bg-gradient-to-b from-brand-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-brand-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have questions or need help? We're here to assist you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="card-hover">
                  <CardContent className="p-6">
                    <a href={info.href} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{info.title}</h3>
                        <p className="text-gray-600">{info.value}</p>
                      </div>
                    </a>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-brand-600">
                <CardContent className="p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">Office Hours</h3>
                  <p className="text-brand-100">Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p className="text-brand-100">Saturday: 10:00 AM - 4:00 PM</p>
                  <p className="text-brand-100">Sunday: Closed</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-brand-600" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600 mb-6">We'll get back to you within 24 hours.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          className="h-12"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="h-12"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Your phone number"
                          className="h-12"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What's this about?"
                          className="h-12"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        className="min-h-[150px]"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Send className="w-4 h-4 mr-2" /> Send Message</>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
