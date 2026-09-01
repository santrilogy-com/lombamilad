import type { MetadataRoute } from 'next';

const BASE_URL = 'https://miladsidogiri.id';

export default function sitemap(): MetadataRoute.Sitemap {
  const halaman = ['', '/daftar', '/cek-status', '/lupa-status', '/info-peserta', '/seleksi'];
  return halaman.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));
}
