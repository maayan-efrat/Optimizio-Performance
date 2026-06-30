"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useLocale } from '@/contexts/locale';

const navItems = [
  { href: '/features' as string, labelHe: 'תכונות', labelEn: 'Features' },
  { href: '/pricing' as string, labelHe: 'מחירים', labelEn: 'Pricing' },
  { href: '/faq' as string, labelHe: 'שאלות נפוצות', labelEn: 'FAQ' },
];

const dashboardItems = [
  { href: '/dashboard' as string, labelHe: 'לוח בקרה', labelEn: 'Dashboard' },
  { href: '/scan' as string, labelHe: 'סריקה', labelEn: 'Scan' },
  { href: '/reports' as string, labelHe: 'דוחות', labelEn: 'Reports' },
  { href: '/settings' as string, labelHe: 'הגדרות', labelEn: 'Settings' },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRtl = locale === 'he';
  const isDashboard = ['/dashboard', '/scan', '/reports', '/competitor-analysis', '/settings', '/scan-details'].some(
    (path) => pathname.startsWith(path),
  );

  const items = isDashboard ? dashboardItems : navItems;
  const label = (item: { labelHe: string; labelEn: string }) => isRtl ? item.labelHe : item.labelEn;

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-violet-500/15 bg-[#0f0a2e]/80 backdrop-blur-xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="navbg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6d28d9"/>
                  <stop offset="100%" stopColor="#0891b2"/>
                </linearGradient>
                <linearGradient id="navarc" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#67e8f9"/>
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="8" fill="url(#navbg)"/>
              <path d="M 18 5 A 13 13 0 1 1 5 18" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M 18 5 A 13 13 0 1 1 8 27" stroke="url(#navarc)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="18" cy="18" r="2.5" fill="white"/>
              <line x1="18" y1="18" x2="26" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-[#f0f4ff] hidden sm:inline tracking-tight text-lg">Optimizio</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className={`text-sm transition-colors ${
                  pathname === item.href
                    ? 'text-violet-400 font-medium'
                    : 'text-[#9b9dc9] hover:text-[#f0f4ff]'
                }`}
              >
                {label(item)}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Credits badge (when logged in) */}
            {user && user.credits !== undefined && (
              <Link
                href="/pricing"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  user.credits < 100
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                }`}
              >
                <Zap className="h-3 w-3" />
                {user.credits} {isRtl ? 'קרדיטים' : 'credits'}
              </Link>
            )}

            {/* Locale toggle */}
            <div className="flex rounded-full border border-violet-500/20 text-xs overflow-hidden">
              <button
                onClick={() => setLocale('he')}
                className={`px-3 py-1.5 transition ${locale === 'he' ? 'bg-violet-500/20 text-[#f0f4ff]' : 'text-[#9b9dc9] hover:text-[#f0f4ff]'}`}
              >
                עב
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1.5 transition ${locale === 'en' ? 'bg-violet-500/20 text-[#f0f4ff]' : 'text-[#9b9dc9] hover:text-[#f0f4ff]'}`}
              >
                EN
              </button>
            </div>

            {user ? (
              <>
                <span className="text-sm text-[#9b9dc9]">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-full border border-violet-500/20 px-3 py-1.5 text-sm text-[#9b9dc9] hover:text-[#f0f4ff] transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {isRtl ? 'יציאה' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#9b9dc9] hover:text-[#f0f4ff] transition">
                  {isRtl ? 'כניסה' : 'Sign in'}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition shadow-lg shadow-violet-500/25"
                >
                  {isRtl ? 'התחילי בחינם' : 'Start Free'}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#9b9dc9]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="flex flex-col gap-4 border-t border-violet-500/15 py-4 md:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className={`text-sm transition ${pathname === item.href ? 'text-violet-400 font-medium' : 'text-[#9b9dc9] hover:text-[#f0f4ff]'}`}
                onClick={() => setMobileOpen(false)}
              >
                {label(item)}
              </Link>
            ))}
            <div className="border-t border-violet-500/15 pt-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setLocale('he')} className={`text-sm px-3 py-1 rounded-full border border-violet-500/20 ${locale === 'he' ? 'bg-violet-500/20 text-[#f0f4ff]' : 'text-[#9b9dc9]'}`}>עברית</button>
                <button onClick={() => setLocale('en')} className={`text-sm px-3 py-1 rounded-full border border-violet-500/20 ${locale === 'en' ? 'bg-violet-500/20 text-[#f0f4ff]' : 'text-[#9b9dc9]'}`}>English</button>
              </div>
              {user ? (
                <>
                  <p className="text-sm text-[#9b9dc9]">{user.name}</p>
                  {user.credits !== undefined && (
                    <Link
                      href="/pricing"
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs w-fit ${
                        user.credits < 100
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                          : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Zap className="h-3 w-3" />
                      {user.credits} {isRtl ? 'קרדיטים' : 'credits'}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#9b9dc9]">
                    <LogOut className="h-3.5 w-3.5" /> {isRtl ? 'יציאה' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-sm text-[#9b9dc9] hover:text-[#f0f4ff]" onClick={() => setMobileOpen(false)}>
                    {isRtl ? 'כניסה' : 'Sign in'}
                  </Link>
                  <Link
                    href="/register"
                    className="block text-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25"
                    onClick={() => setMobileOpen(false)}
                  >
                    {isRtl ? 'התחילי בחינם' : 'Start Free'}
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
