import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ko', 'ja', 'zh', 'zh-TW', 'fr', 'de', 'es', 'ar', 'th'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'  // 영어(기본)는 / 그대로, 나머지는 /ko /ja 등 붙음
});
