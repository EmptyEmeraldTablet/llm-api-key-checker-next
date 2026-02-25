import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://check.chat-tempmail.com';
  const locales = ['en', 'zh-cn'];

  return locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
    alternates: {
      languages: {
        en: `${baseUrl}/en`,
        'zh-CN': `${baseUrl}/zh-cn`,
      },
    },
  }));
}
