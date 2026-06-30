"use client";

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/locale';
import { getDictionary } from '@/lib/i18n';

export default function FAQPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale).faq;
  const isRtl = locale === 'he';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-transparent text-[#F9FAFB]" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <h1 className="text-4xl font-semibold sm:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg text-[#A1A1AA]">{t.subtitle}</p>
        </motion.div>

        <div className="space-y-4">
          {t.items.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`w-full rounded-2xl border border-white/10 bg-[#111827]/90 p-4 ${isRtl ? 'text-right' : 'text-left'} transition hover:bg-[#111827]`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-[#F9FAFB]">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#A1A1AA] transition ${openIndex === index ? 'rotate-180' : ''}`}
                  />
                </div>
                {openIndex === index && (
                  <p className="mt-4 text-[#A1A1AA] leading-7">{faq.answer}</p>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
