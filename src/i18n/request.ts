import { getRequestConfig } from 'next-intl/server';
import { LOCALE_CODES, DEFAULT_LOCALE } from '@/lib/locales';

export const locales = LOCALE_CODES;
export type Locale = (typeof LOCALE_CODES)[number];

export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
