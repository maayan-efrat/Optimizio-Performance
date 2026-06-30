"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/contexts/locale';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const isRtl = locale === 'he';
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordOk = password.length >= 8;
  const passwordsMatch = password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordOk || !passwordsMatch) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Error');
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isRtl ? 'שגיאה. הקישור אולי פג תוקף.' : 'Error. The link may have expired.'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center text-[#A1A1AA]">
          {isRtl ? 'קישור לא תקף.' : 'Invalid link.'}{' '}
          <Link href="/forgot-password" className="text-violet-400">{isRtl ? 'נסו שוב' : 'Try again'}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-8 shadow-glow backdrop-blur-xl">
          {done ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-[#F9FAFB] mb-3">
                {isRtl ? 'הסיסמה עודכנה! ✅' : 'Password updated! ✅'}
              </h1>
              <p className="text-[#A1A1AA] text-sm">
                {isRtl ? 'מועברת לדף ההתחברות...' : 'Redirecting to login...'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-[#F9FAFB]">
                  {isRtl ? 'בחרו סיסמה חדשה' : 'Choose a new password'}
                </h1>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  {isRtl ? 'הסיסמה חייבת להכיל לפחות 8 תווים.' : 'Password must be at least 8 characters.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    {isRtl ? 'סיסמה חדשה' : 'New password'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-[#A1A1AA]`} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-violet-500 focus:outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    {isRtl ? 'אשרי סיסמה' : 'Confirm password'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-[#A1A1AA]`} />
                    <input
                      type="password"
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-violet-500 focus:outline-none`}
                    />
                  </div>
                </div>

                {password.length > 0 && (
                  <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    passwordOk ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'
                  }`}>
                    {passwordOk ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {passwordOk ? (isRtl ? 'אורך סיסמה תקין' : 'Password length OK') : (isRtl ? 'לפחות 8 תווים' : 'At least 8 characters')}
                  </div>
                )}

                {confirm.length > 0 && !passwordsMatch && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    <XCircle className="h-4 w-4" />
                    {isRtl ? 'הסיסמאות לא תואמות' : 'Passwords do not match'}
                  </div>
                )}

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !passwordOk || !passwordsMatch}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 py-3 font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (isRtl ? 'מעדכנת...' : 'Updating...')
                    : (isRtl ? 'שמרי סיסמה חדשה' : 'Save new password')}
                  {!loading && <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
