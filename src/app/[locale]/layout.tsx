import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { routing } from './routing';
import { DEFAULT_LOCALE, isValidLocale } from '@/lib/locales';
import '../globals.css';

const baseUrl = 'https://check.chat-tempmail.com';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = (await import(`../../../messages/${safeLocale}.json`)).default as {
    app: { title: string; subtitle: string };
    seo: { keywords: string };
  };

  const title = messages.app.title;
  const description = messages.app.subtitle;
  const keywords = messages.seo.keywords;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${safeLocale}`,
      languages: {
        en: '/en',
        'zh-CN': '/zh-cn',
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${safeLocale}`,
      siteName: 'LLM API Key Checker',
      locale: safeLocale === 'zh-cn' ? 'zh_CN' : 'en_US',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    keywords,
    robots: { index: true, follow: true },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = (await import(`../../../messages/${safeLocale}.json`)).default;

  return (
    <html lang={safeLocale}>
      <body>
        <NextIntlClientProvider locale={safeLocale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
