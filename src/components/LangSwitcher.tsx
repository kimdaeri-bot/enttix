'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useState, useRef, useEffect } from 'react';

const LANGS = [
  { code: 'en',    label: 'English',     flag: '🇬🇧' },
  { code: 'ko',    label: '한국어',       flag: '🇰🇷' },
  { code: 'ja',    label: '日本語',       flag: '🇯🇵' },
  { code: 'zh',    label: '中文(简体)',   flag: '🇨🇳' },
  { code: 'zh-TW', label: '中文(繁體)',   flag: '🇹🇼' },
  { code: 'fr',    label: 'Français',    flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch',     flag: '🇩🇪' },
  { code: 'es',    label: 'Español',     flag: '🇪🇸' },
  { code: 'th',    label: 'ภาษาไทย',     flag: '🇹🇭' },
  { code: 'ar',    label: 'العربية',     flag: '🇸🇦' },
];

export function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();   // next-intl: locale prefix 없는 순수 경로
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchTo = (code: string) => {
    // next-intl router.push(pathname, { locale }) 이 자동으로 prefix 처리
    router.push(pathname, { locale: code });
    setOpen(false);
  };

  const current = LANGS.find(l => l.code === locale) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => switchTo(l.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors
                ${l.code === locale ? 'font-semibold text-blue-600 bg-blue-50' : 'text-gray-700'}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === locale && (
                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
