/**
 * Rate limiter sederhana (in-memory). Untuk produksi serverless multi-instance
 * disarankan memakai penyimpanan terpusat (mis. Upstash Redis). Implementasi ini
 * cukup untuk satu instance / dev dan sebagai lapisan pertama anti-spam.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): {
  ok: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

export function ipFromRequest(req: Request): string {
  // Vercel's edge appends the real client IP as the LAST hop of x-forwarded-for;
  // any earlier hop (including the first one) can be set by the client itself,
  // so trusting the first value lets anyone bypass rate limiting by sending a
  // fake X-Forwarded-For header. Read the last hop instead.
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const parts = fwd.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Sama seperti ipFromRequest, tapi untuk headers berbentuk objek biasa
 * (mis. yang diteruskan NextAuth ke authorize(), bukan instance Headers). */
export function ipFromHeaderRecord(headers: Record<string, unknown> | undefined | null): string {
  const raw = headers?.['x-forwarded-for'];
  const fwd: string | null = Array.isArray(raw) ? String(raw[0]) : typeof raw === 'string' ? raw : null;
  if (fwd) {
    const parts = fwd.split(',').map((p: string) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  const real = headers?.['x-real-ip'];
  const realStr: string | null = Array.isArray(real) ? String(real[0]) : typeof real === 'string' ? real : null;
  return realStr || 'unknown';
}
