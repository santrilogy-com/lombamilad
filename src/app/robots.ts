import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /admin sengaja tidak dicantumkan di sini — robots.txt bersifat publik,
        // mencantumkan path admin cuma memberi peta ke penyerang. Path itu sudah
        // auth-gated dan diberi header X-Robots-Tag: noindex (lihat next.config.mjs)
        // supaya tidak terindeks tanpa perlu diumumkan di sini.
        disallow: ['/api'],
      },
    ],
    sitemap: 'https://miladsidogiri.id/sitemap.xml',
  };
}
