"use client";

import { motion, AnimatePresence } from 'framer-motion';
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

        <div className="space-y-3">
          {t.items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-violet-500/30 bg-[#111827]'
                    : 'border-white/10 bg-[#111827]/90 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={`w-full flex items-center justify-between gap-4 p-5 ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <span className={`font-semibold text-[#F9FAFB] ${isOpen ? 'text-violet-200' : ''} transition-colors duration-200`}>
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="shrink-0"
                  >
                    <ChevronDown className={`h-5 w-5 transition-colors duration-200 ${isOpen ? 'text-violet-400' : 'text-[#A1A1AA]'}`} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-5 pb-5">
                        <div className="border-t border-violet-500/15 pt-4">
                          <p className="text-[#A1A1AA] leading-7">{faq.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
