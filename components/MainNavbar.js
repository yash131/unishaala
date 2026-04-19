'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Menu, X } from 'lucide-react';

export function MainNavbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for logged-in user
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    checkUser();
    
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkUser);
    
    // Custom event for same-tab login/logout
    window.addEventListener('userChanged', checkUser);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userChanged', checkUser);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('user');
    setUser(null);
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('userChanged'));
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/exams', label: 'Test Series' },
    { href: '/blogs', label: 'Blogs' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/rank-predictor', label: 'Rank Predictor' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Logo size="default" showText={false} />
            <div className="flex gap-4">
              <div className="w-20 h-10 bg-gray-100 animate-pulse rounded"></div>
              <div className="w-20 h-10 bg-gray-100 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="default" showText={false} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`font-medium transition-colors ${
                  pathname === link.href 
                    ? 'text-teal-600' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-600">Hi, {user.name?.split(' ')[0]}</span>
                {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                  <Link href="/admin">
                    <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-red-600"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <button 
            className="md:hidden p-2" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`block py-2 ${
                  pathname === link.href 
                    ? 'text-teal-600 font-medium' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-4">
              {user ? (
                <>
                  <span className="flex-1 py-2 text-gray-600">Hi, {user.name?.split(' ')[0]}</span>
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <Link href="/admin" className="flex-1">
                      <Button variant="outline" className="w-full border-teal-600 text-teal-600">Admin</Button>
                    </Link>
                  )}
                  <Button className="flex-1 bg-gray-200 text-gray-700" onClick={handleLogout}>Logout</Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full border-teal-600 text-teal-600">Login</Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full bg-rose-500 hover:bg-rose-600">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default MainNavbar;
