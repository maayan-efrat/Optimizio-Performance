"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { locale } = useLocale();
  const t = getDictionary(locale).register;
  const isRtl = locale === 'he';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const passwordOk = password.length >= 8;
  const iconSide = isRtl ? 'right-3' : 'left-3';
  const inputPad = isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordOk) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await api.auth.register({ email, password, name });
      if (res.token && res.user) {
        login(res.token, res.user);
        router.push('/onboarding');
        return;
      }
      setEmailSent(true);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg === 'SERVER_OFFLINE') {
        setError(isRtl ? 'השרת אינו זמין. ודאי שהוא רץ ונסי שוב.' : 'Server is offline. Make sure the API is running.');
      } else if (msg.toLowerCase().includes('already') || msg.includes('409')) {
        setError(isRtl ? 'כתובת מייל זו כבר רשומה במערכת.' : 'Email already registered.');
      } else {
        setError(isRtl ? `שגיאה: ${msg}` : `Error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-transparent px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-10 shadow-glow backdrop-blur-xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30">
              <Inbox className="h-10 w-10 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#F9FAFB] mb-3">
              {isRtl ? 'בדקי את תיבת הדואר שלך! 📬' : 'Check your inbox! 📬'}
            </h1>
            <p className="text-[#A1A1AA] mb-2">
              {isRtl
                ? `שלחנו מייל אימות לכתובת`
                : `We sent a verification email to`}
            </p>
            <p className="text-violet-400 font-semibold mb-6">{email}</p>
            <p className="text-[#64748B] text-sm mb-8">
              {isRtl
                ? 'לחצי על הקישור במייל כדי לאמת את החשבון שלך. הקישור תקף ל-24 שעות.'
                : 'Click the link in the email to verify your account. The link expires in 24 hours.'}
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-[#EC4899] hover:text-[#EC4899]/80 font-medium">
              {isRtl ? 'חזרה להתחברות' : 'Back to login'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#F9FAFB]">{t.title}</h1>
            <p className="mt-2 text-sm text-[#A1A1AA]">{t.subtitle}</p>
          </div>

          {/* Google OAuth */}
          <a
            href={`${API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-[#F9FAFB] hover:bg-white/10 transition-colors mb-6 w-full"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isRtl ? 'המשכי עם Google' : 'Continue with Google'}
          </a>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#111827] px-3 text-[#A1A1AA]">{isRtl ? 'או עם מייל' : 'or with email'}</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#F9FAFB] mb-2">{t.name}</label>
              <div className="relative">
                <User className={`absolute ${iconSide} top-3 h-4 w-4 text-[#A1A1AA]`} />
                <input id="name" type="text" placeholder={t.namePlaceholder} required value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full ${inputPad} py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-[#EC4899] focus:outline-none`} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#F9FAFB] mb-2">{t.email}</label>
              <div className="relative">
                <Mail className={`absolute ${iconSide} top-3 h-4 w-4 text-[#A1A1AA]`} />
                <input id="email" type="email" placeholder={t.emailPlaceholder} required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${inputPad} py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-[#EC4899] focus:outline-none`} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#F9FAFB] mb-2">{t.password}</label>
              <div className="relative">
                <Lock className={`absolute ${iconSide} top-3 h-4 w-4 text-[#A1A1AA]`} />
                <input id="password" type="password" placeholder={t.passwordPlaceholder} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${inputPad} py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-[#EC4899] focus:outline-none`} />
              </div>
            </div>

            <AnimatePresence>
              {password.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={`rounded-lg border p-3 ${passwordOk ? 'border-[#22C55E]/20 bg-[#22C55E]/10' : 'border-red-500/20 bg-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    {passwordOk ? <CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <p className={`text-sm ${passwordOk ? 'text-[#22C55E]' : 'text-red-400'}`}>
                      {passwordOk ? t.passwordOk : t.passwordWeak}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
            )}

            <label className="flex items-start gap-2">
              <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 rounded border-white/10 mt-1" />
              <span className="text-sm text-[#A1A1AA]">{t.agree}</span>
            </label>

            <Button className="w-full" disabled={isLoading || !passwordOk}>
              {isLoading ? t.submitting : t.submit} <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#A1A1AA]">
            {t.hasAccount}{' '}
            <Link href="/login" className="text-[#EC4899] hover:text-[#EC4899]/80">{t.login}</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
