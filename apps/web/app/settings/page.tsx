"use client";

import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Globe, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useAuth } from '@/contexts/auth';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';

export default function SettingsPage() {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = getDictionary(locale).settings;
  const isRtl = locale === 'he';

  const [name, setName] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState('saving');
    setTimeout(() => setSaveState('saved'), 800);
    setTimeout(() => setSaveState('idle'), 3000);
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB] outline-none focus:border-[#EC4899]';

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-3xl flex flex-col gap-8">

          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-8 shadow-glow">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-[#8B5CF6]">
              <SettingsIcon className="h-4 w-4" /> {t.title}
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{t.title}</h1>
          </motion.header>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="space-y-6">

            {/* Profile */}
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle>{t.profile}</CardTitle>
                <CardDescription>{t.profileDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.name}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.email}</label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      disabled
                      className={`${inputCls} opacity-50 cursor-not-allowed`}
                    />
                    <p className="mt-1 text-xs text-[#A1A1AA]">{t.emailNote}</p>
                  </div>
                  <Button type="submit" disabled={saveState === 'saving'} className="flex items-center gap-2">
                    {saveState === 'saved' && <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />}
                    {saveState === 'saving' ? t.saving : saveState === 'saved' ? t.saved : t.saveProfile}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" /> {t.preferences}
                </CardTitle>
                <CardDescription>{t.preferencesDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.language}</p>
                    <p className="text-sm text-[#A1A1AA]">{t.languageDesc}</p>
                  </div>
                  <div className="flex rounded-full border border-white/10 text-sm overflow-hidden">
                    <button
                      onClick={() => setLocale('he')}
                      className={`px-4 py-2 transition ${locale === 'he' ? 'bg-white/15 text-[#F9FAFB]' : 'text-[#A1A1AA] hover:text-[#F9FAFB]'}`}
                    >
                      {t.langHe}
                    </button>
                    <button
                      onClick={() => setLocale('en')}
                      className={`px-4 py-2 transition ${locale === 'en' ? 'bg-white/15 text-[#F9FAFB]' : 'text-[#A1A1AA] hover:text-[#F9FAFB]'}`}
                    >
                      {t.langEn}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" /> {t.notifications}
                </CardTitle>
                <CardDescription>{t.notificationsDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {t.notifItems.map((item) => (
                  <label key={item.label} className="flex items-center gap-3 border-b border-white/10 pb-4 last:border-0 cursor-pointer">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded shrink-0" />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-[#A1A1AA]">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle>{t.subscription}</CardTitle>
                <CardDescription>{t.subscriptionDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.currentPlan}</p>
                    <p className="text-sm text-[#A1A1AA]">{t.planName}</p>
                  </div>
                  <Badge className="bg-[#EC4899]/20 text-[#EC4899]">{t.planActive}</Badge>
                </div>
              </CardContent>
            </Card>

          </motion.div>
        </div>
      </main>
    </ProtectedLayout>
  );
}
