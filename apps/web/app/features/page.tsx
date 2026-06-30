"use client";

import { motion } from 'framer-motion';
import { BarChart3, Brain, Compass, Zap, Shield, TrendingUp } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';

const icons = [Zap, Brain, BarChart3, Compass, Shield, TrendingUp];

export default function FeaturesPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale).features;
  const isRtl = locale === 'he';

  return (
    <main className="min-h-screen bg-transparent text-[#F9FAFB]" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <h1 className="text-4xl font-semibold sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#A1A1AA]">{t.subtitle}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="bg-[#111827]/90 h-full">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20">
                      <Icon className="h-5 w-5 text-[#EC4899]" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
