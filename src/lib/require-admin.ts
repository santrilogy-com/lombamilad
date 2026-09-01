import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Ambil sesi admin yang sedang login, atau null bila tidak ada/tidak valid.
 * Dipusatkan di sini supaya semua route admin memakai aturan otorisasi yang
 * sama persis, dan route baru tidak bisa lupa menambahkan pengecekan ini.
 */
export async function requireAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session?.user ? session : null;
}
