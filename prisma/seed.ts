import { PrismaClient } from '@prisma/client';
import { LOMBA } from '../src/lib/data';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Cabang (lomba)
  for (const c of LOMBA) {
    await prisma.cabang.upsert({
      where: { id: c.id },
      update: { nama: c.name, kuota: c.kuota, aktif: true },
      create: { id: c.id, nama: c.name, kuota: c.kuota, aktif: true },
    });
  }
  console.log(`Seeded ${LOMBA.length} cabang.`);

  // Admin default — wajib di-set eksplisit lewat env, tidak boleh jatuh ke
  // kredensial tebakan (dulu ada default "Sidogiri290!" yang juga tertulis
  // di .env.example, jadi tebakan pertama siapa pun yang membaca repo ini).
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nama = process.env.ADMIN_NAMA || 'Administrator';
  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL dan ADMIN_PASSWORD wajib diset di environment sebelum menjalankan seed (tidak ada default lagi).'
    );
  }
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (!existing) {
    await prisma.admin.create({
      data: {
        email,
        nama,
        passwordHash: bcrypt.hashSync(password, 10),
      },
    });
    console.log(`Admin seeded: ${email}`);
  } else {
    console.log('Admin already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
