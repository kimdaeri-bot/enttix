'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
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

// 지원 locale 코드 목록
const LOCALE_CODES = LANGS.map(l => l.code);

export function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchTo = (code: string) => {
    // 현재 pathname에서 locale prefix 제거
    const segments = pathname.split('/');
    const hasLocale = LOCALE_CODES.includes(segments[1]);
    const rest = hasLocale ? '/' + segments.slice(2).join('/') : pathname;
    const cleanRest = rest === '/' ? '' : rest;

    // 기본 locale(en)은 prefix 없음, 나머지는 /코드 붙임
    const newPath = code === 'en' ? (cleanRest || '/') : `/${code}${cleanRest || '/'}`;
    router.push(newPath);
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
