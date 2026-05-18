import { config as loadDotenv } from 'dotenv';
import { PrismaClient } from '../src/generated/catalog-prisma';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const seedDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(seedDir, '..');

function loadEnvFromAncestors(): void {
  const paths: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 12; i += 1) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) {
      paths.push(candidate);
    }
    const parent = join(dir, '..');
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  paths.reverse();
  for (const p of paths) {
    loadDotenv({ path: p, override: true });
  }
}

loadEnvFromAncestors();

const prisma = new PrismaClient();

const MINIMAL_1PX_WEBP = Buffer.from('UklGRhYAAABXRUJQVlA4TAoAAAAvAAAAAEX/I/of', 'base64');

type SourceEntry = {
  Id: number;
  Type: string;
  Brand: string;
  Name: string;
  Description?: string;
  Price: number;
};

function seededVectorFromId(id: number, dim = 384): string {
  let s = id * 73856093;
  const parts: number[] = [];
  for (let i = 0; i < dim; i += 1) {
    s = (s * 1103515245 + 12345) >>> 0;
    parts.push(Number(((s % 2000) / 2000 - 0.5).toFixed(6)));
  }
  return `[${parts.join(',')}]`;
}

async function main() {
  const jsonPath = join(seedDir, 'fixtures', 'catalog.json');
  const sources: SourceEntry[] = JSON.parse(readFileSync(jsonPath, 'utf8')) as SourceEntry[];
  const picsDir = join(appRoot, 'assets', 'pics');
  mkdirSync(picsDir, { recursive: true });
  const templatePic = join(picsDir, '1.webp');

  if (!existsSync(templatePic)) {
    writeFileSync(templatePic, MINIMAL_1PX_WEBP);
  }

  await prisma.$transaction([
    prisma.catalogItem.deleteMany(),
    prisma.catalogBrand.deleteMany(),
    prisma.catalogType.deleteMany(),
  ]);

  const brandNames = [...new Set(sources.map((x) => x.Brand).filter(Boolean))];
  const typeNames = [...new Set(sources.map((x) => x.Type).filter(Boolean))];

  await prisma.catalogBrand.createMany({
    data: brandNames.map((Brand) => ({ Brand })),
  });
  await prisma.catalogType.createMany({
    data: typeNames.map((Type) => ({ Type })),
  });

  const brands = await prisma.catalogBrand.findMany();
  const types = await prisma.catalogType.findMany();
  const brandId = new Map(brands.map((b) => [b.Brand, b.Id]));
  const typeId = new Map(types.map((t) => [t.Type, t.Id]));

  for (const s of sources) {
    await prisma.catalogItem.create({
      data: {
        Id: s.Id,
        Name: s.Name,
        Description: s.Description ?? null,
        Price: s.Price,
        CatalogBrandId: brandId.get(s.Brand)!,
        CatalogTypeId: typeId.get(s.Type)!,
        AvailableStock: 100,
        RestockThreshold: 10,
        MaxStockThreshold: 200,
        PictureFileName: `${s.Id}.webp`,
        OnReorder: false,
      },
    });
    const dst = join(picsDir, `${s.Id}.webp`);
    if (!existsSync(dst)) {
      copyFileSync(templatePic, dst);
    }
  }

  for (const s of sources) {
    const vec = seededVectorFromId(s.Id);
    await prisma.$executeRawUnsafe(
      `UPDATE "Catalog" SET "Embedding" = $1::vector WHERE "Id" = $2::integer`,
      vec,
      s.Id,
    );
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
