import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const passwordLama = String(body.passwordLama || '');
  const passwordBaru = String(body.passwordBaru || '');

  if (!passwordLama || !passwordBaru) {
    return NextResponse.json({ error: 'Password lama dan password baru wajib diisi.' }, { status: 400 });
  }
  if (passwordBaru.length < 8) {
    return NextResponse.json({ error: 'Password baru minimal 8 karakter.' }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: session.user.id } });
  if (!admin) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });

  const cocok = bcrypt.compareSync(passwordLama, admin.passwordHash);
  if (!cocok) {
    return NextResponse.json({ error: 'Password lama salah.' }, { status: 400 });
  }

  const passwordHash = bcrypt.hashSync(passwordBaru, 10);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });

  return NextResponse.json({ success: true });
}
