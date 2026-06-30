"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({ locale: 'he', setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he');

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved === 'en' || saved === 'he') setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    localStorage.setItem('locale', l);
    setLocaleState(l);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
