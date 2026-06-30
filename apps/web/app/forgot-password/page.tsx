"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/contexts/locale';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError(isRtl ? 'שגיאה. נסו שוב.' : 'Error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-8 shadow-glow backdrop-blur-xl">
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-[#F9FAFB] mb-3">
                {isRtl ? 'בדקו את תיבת הדואר! 📬' : 'Check your inbox! 📬'}
              </h1>
              <p className="text-[#A1A1AA] text-sm mb-6">
                {isRtl
                  ? 'אם הכתובת קיימת במערכת, שלחנו קישור לאיפוס סיסמה. הקישור תקף לשעה אחת.'
                  : 'If that email exists, we sent a password reset link. The link expires in 1 hour.'}
              </p>
              <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                {isRtl ? 'חזרה להתחברות' : 'Back to login'}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-[#F9FAFB]">
                  {isRtl ? 'שכחת סיסמה?' : 'Forgot password?'}
                </h1>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  {isRtl
                    ? 'הכניסו את כתובת המייל שלכם ונשלח קישור לאיפוס סיסמה.'
                    : "Enter your email and we'll send you a reset link."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    {isRtl ? 'כתובת מייל' : 'Email address'}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-[#A1A1AA]`} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={isRtl ? 'your@email.com' : 'your@email.com'}
                      className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-violet-500 focus:outline-none`}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 py-3 font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (isRtl ? 'שולח...' : 'Sending...')
                    : (isRtl ? 'שלחו קישור לאיפוס' : 'Send reset link')}
                  {!loading && <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#A1A1AA]">
                {isRtl ? 'נזכרת?' : 'Remember?'}{' '}
                <Link href="/login" className="text-violet-400 hover:text-violet-300">
                  {isRtl ? 'התחברו' : 'Sign in'}
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
