// Next.js App Router menyuntik payload hydration lewat <script> inline (bukan
// file eksternal), jadi script-src butuh 'unsafe-inline' kecuali memakai nonce
// per-request via middleware (infrastruktur tambahan yang tidak ada di proyek
// ini). Semua fetch di aplikasi ini same-origin (ke /api/...), dan semua berkas
// peserta disajikan lewat proxy /api/berkas — jadi connect-src/img-src/media-src
// aman dibatasi ke 'self' saja tanpa perlu izinkan domain eksternal.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Variant khusus /panggilan/* (sidang video Jitsi Meet, lihat src/app/panggilan): embed-nya
// memuat external_api.js dari meet.jit.si lalu menyuntikkan iframe cross-origin ke domain yang
// sama untuk audio/video call-nya. Cukup izinkan meet.jit.si secara spesifik di script-src (skrip
// loader-nya) dan frame-src (iframe call-nya) — WebRTC/media di dalam iframe berjalan dalam
// konteks dokumen meet.jit.si sendiri, bukan connect-src/media-src halaman ini, jadi keduanya
// TETAP dibatasi ke 'self' seperti semula.
const CSP_PANGGILAN = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://meet.jit.si",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-src 'self' https://meet.jit.si",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Kamera diizinkan untuk same-origin (dipakai fitur verifikasi wajah kuis MQK di
          // /kuis-mqk); mikrofon & geolokasi tetap diblokir karena tidak dipakai sama sekali.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
      {
        // Dijaga tidak terindeks tanpa perlu mengumumkan path-nya di robots.txt (lihat robots.ts).
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // Override CSP/Permissions-Policy hanya di halaman sidang video — lihat komentar
        // CSP_PANGGILAN di atas. Next.js menerapkan header dari SEMUA blok source yang cocok
        // untuk key yang sama menimpa nilai dari blok sebelumnya, jadi ini menggantikan nilai
        // dari blok '/:path*' di atas hanya untuk path ini, tanpa melonggarkan halaman lain.
        source: '/panggilan/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=()' },
          { key: 'Content-Security-Policy', value: CSP_PANGGILAN },
        ],
      },
    ];
  },
};

export default nextConfig;
