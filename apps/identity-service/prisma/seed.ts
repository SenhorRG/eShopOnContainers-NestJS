import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/identity-prisma';

const seedDir = dirname(fileURLToPath(import.meta.url));

type SeedUser = {
  email: string;
  displayName: string;
};

function readSeedDefaultPassword(): string {
  const fromEnv = process.env.ESHOP_SEED_USER_PASSWORD?.trim();
  if (fromEnv?.length) {
    return fromEnv;
  }

  const path = join(seedDir, 'fixtures', 'seed-dev-defaults.json');
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as { defaultPassword?: string };
  const fromFixture = parsed.defaultPassword?.trim();
  if (!fromFixture?.length) {
    throw new Error(
      'Seed password missing. Set ESHOP_SEED_USER_PASSWORD or fixtures/seed-dev-defaults.json defaultPassword.',
    );
  }
  return fromFixture;
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixturesPath = join(seedDir, 'fixtures', 'users.json');
  const users = JSON.parse(readFileSync(fixturesPath, 'utf8')) as SeedUser[];
  const plainPassword = readSeedDefaultPassword();
  const passwordHash = await hash(plainPassword, 12);

  for (const user of users) {
    await prisma.identityUser.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        displayName: user.displayName,
      },
      create: {
        email: user.email,
        passwordHash,
        displayName: user.displayName,
      },
    });
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
