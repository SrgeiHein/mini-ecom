import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const DEMO_EMAIL = 'demo@mini-ecom.test';
const DEMO_PASSWORD = 'Demo!Pass123';

const CATEGORIES = [
  'Headphones',
  'Keyboard',
  'Mouse',
  'Monitor',
  'Webcam',
  'Desk Lamp',
  'Notebook',
  'Backpack',
  'Mug',
  'T-Shirt',
];

function priceCentsFor(i: number) {
  return 1999 + ((i * 137) % 18000);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash },
  });

  const COUNT = 75;
  const data = Array.from({ length: COUNT }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length];
    const n = i + 1;
    return {
      sku: `SKU-${String(n).padStart(4, '0')}`,
      name: `${category} Model ${n}`,
      description: `A reliable ${category.toLowerCase()} — item #${n} in the demo catalog.`,
      category,
      priceCents: priceCentsFor(i),
      currency: 'USD',
      imageUrl: `https://picsum.photos/seed/product-${n}/400/400`,
      stock: ((i * 7) % 50) + 1,
    };
  });

  await prisma.product.createMany({ data, skipDuplicates: true });

  const total = await prisma.product.count();
  console.log(
    `Seed complete. Demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}. Products in DB: ${total}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
