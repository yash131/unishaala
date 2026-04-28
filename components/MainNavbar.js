'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu, X, User, LayoutDashboard, Settings, ClipboardList, BookOpen,
  ScrollText, Crown, LogOut, Shield
} from 'lucide-react';

export function MainNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); }
        catch (_e) { localStorage.removeItem('user'); setUser(null); }
      } else setUser(null);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('userChanged', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userChanged', checkUser);
    };
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (_e) {}
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('userChanged'));
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/exams', label: 'Test Series' },
    { href: '/practice', label: 'Practice' },
    { href: '/previous-year', label: 'PYQ' },
    { href: '/blogs', label: 'Blogs' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/contact', label: 'Contact' },
  ];

  // Profile dropdown menu items (order per product spec)
  const profileMenu = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'Manage Account', icon: Settings },
    { href: '/exams', label: 'Test Series', icon: ClipboardList },
    { href: '/practice', label: 'Practice Questions', icon: BookOpen },
    { href: '/previous-year', label: 'Previous Year Questions', icon: ScrollText },
    { href: '/get-pass', label: 'Get Pass', icon: Crown, highlight: true },
  ];

  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="default" />

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href ? 'text-brand-600' : 'text-gray-700 hover:text-brand-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition"
                    aria-label="Profile menu"
                  >
                    <Avatar user={user} initial={initial} />
                    {user.hasPass && <Crown className="w-4 h-4 text-amber-500" title="Active Pass" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-semibold">{user.name || 'Student'}</span>
                    <span className="text-xs text-gray-500 font-normal truncate">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profileMenu.map((m) => (
                    <DropdownMenuItem key={m.href} asChild>
                      <Link href={m.href} className={`flex items-center gap-2 ${m.highlight ? 'text-amber-700 font-semibold' : ''}`}>
                        <m.icon className={`w-4 h-4 ${m.highlight ? 'text-amber-500' : ''}`} />
                        {m.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 text-brand-700 font-semibold">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-brand-500 hover:bg-brand-600 text-white">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 ${
                  pathname === link.href ? 'text-brand-600 font-medium' : 'text-gray-700 hover:text-brand-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t mt-2 pt-2">
              {user ? (
                <>
                  <div className="py-2 px-1 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">{initial}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  {profileMenu.map(m => (
                    <Link key={m.href} href={m.href} onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-2 py-2 ${m.highlight ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                      <m.icon className={`w-4 h-4 ${m.highlight ? 'text-amber-500' : ''}`} /> {m.label}
                    </Link>
                  ))}
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <Link href="/admin" className="flex items-center gap-2 py-2 text-brand-700 font-semibold" onClick={() => setIsMenuOpen(false)}>
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-red-600 w-full text-left">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Link href="/login" className="flex-1"><Button variant="outline" className="w-full border-brand-600 text-brand-600">Login</Button></Link>
                  <Link href="/signup" className="flex-1"><Button className="w-full bg-brand-500 hover:bg-brand-600">Sign Up</Button></Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


function Avatar({ user, initial }) {
  const [failed, setFailed] = useState(false);
  // Only attempt to load the image if we have a user id AND either we were told
  // an avatar exists OR we haven't already failed a previous load.
  const tryImage = !!user?.id && !failed;
  const src = tryImage ? `/api/user/${user.id}/avatar` : null;
  return (
    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold shadow overflow-hidden">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}
