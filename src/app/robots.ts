import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Halaman admin & API tidak perlu (dan tidak boleh) diindeks mesin pencari.
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: 'https://miladsidogiri.id/sitemap.xml',
  };
}
