import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../src/generated/ordering-prisma';

const seedDir = dirname(fileURLToPath(import.meta.url));

type CardTypeFixture = {
  Id: number;
  Name: string;
};

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.orderingCardType.count();
  if (existing > 0) {
    return;
  }

  const fixturesPath = join(seedDir, 'fixtures', 'card-types.json');
  const cardTypes = JSON.parse(readFileSync(fixturesPath, 'utf8')) as CardTypeFixture[];

  await prisma.orderingCardType.createMany({
    data: cardTypes,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
