import { DEFAULT_LOCALE } from './src/lib/locales';

export default async function getRequestConfig() {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
}
