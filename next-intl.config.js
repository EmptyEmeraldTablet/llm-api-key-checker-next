/** @type {import('next-intl').NextIntlConfig} */
const { DEFAULT_LOCALE } = require('./src/lib/locales');

module.exports = async function getRequestConfig() {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
};
