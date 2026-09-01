import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromHeaderRecord } from '@/lib/rate-limit';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase();
        // Batasi percobaan login per akun & per IP supaya password admin tidak
        // bisa ditebak lewat brute-force — sebelumnya tidak ada pembatasan sama sekali.
        const ip = ipFromHeaderRecord(req?.headers);
        const rlEmail = rateLimit(`login-email:${email}`, 8, 15 * 60_000);
        const rlIp = rateLimit(`login-ip:${ip}`, 20, 15 * 60_000);
        if (!rlEmail.ok || !rlIp.ok) return null;

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) return null;
        const ok = bcrypt.compareSync(credentials.password, admin.passwordHash);
        if (!ok) return null;
        return { id: admin.id, email: admin.email, name: admin.nama };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
