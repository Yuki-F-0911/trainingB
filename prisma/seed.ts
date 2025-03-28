import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // AIユーザーを作成
  const aiUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'AIアシスタント',
      email: 'ai@training-board.com',
      username: 'ai-assistant',
      password: await bcrypt.hash('ComplexPassword123!', 10),
    },
  });

  console.log('AIユーザーを作成しました:', aiUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 