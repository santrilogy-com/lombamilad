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

  // Admin default
  const email = process.env.ADMIN_EMAIL || 'admin@miladsidogiri.id';
  const password = process.env.ADMIN_PASSWORD || 'Sidogiri290!';
  const nama = process.env.ADMIN_NAMA || 'Administrator';
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
