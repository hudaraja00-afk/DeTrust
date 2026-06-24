import 'dotenv/config';
import type { Prisma } from '@prisma/client';
import { SecureFileCategory } from '@prisma/client';

import { prisma } from '../src/config/database';
import { storageService } from '../src/services/storage.service';

const args = process.argv.slice(2);
const getArg = (key: string) => {
  const match = args.find((arg) => arg.startsWith(`--${key}=`));
  return match ? match.split('=')[1] : undefined;
};

const dryRun = args.includes('--dry-run');
const batchSize = Number(getArg('batch') ?? '10');
const idFilter = getArg('id');
const userFilter = getArg('user');
const categoryFilter = getArg('category');

const normalizeCategory = (value?: string): SecureFileCategory | undefined => {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (upper in SecureFileCategory) {
    return SecureFileCategory[upper as keyof typeof SecureFileCategory];
  }
  throw new Error(`Unknown SecureFileCategory: ${value}`);
};

async function main() {
  const where: Prisma.SecureFileWhereInput = {};
  if (idFilter) {
    where.id = idFilter;
  }
  if (userFilter) {
    where.userId = userFilter;
  }
  const category = normalizeCategory(categoryFilter);
  if (category) {
    where.category = category;
  }

  const total = await prisma.secureFile.count({ where });
  console.log(`🔐 Secure file re-encryption${dryRun ? ' (dry-run)' : ''}`);
  console.log(`→ Batch size: ${batchSize}`);
  console.log(`→ Filters: ${JSON.stringify(where)}`);
  console.log(`→ Matching files: ${total}`);

  if (total === 0) {
    return;
  }

  let processed = 0;
  let updated = 0;

  while (processed < total) {
    const files = await prisma.secureFile.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: processed,
      take: batchSize,
    });

    if (files.length === 0) {
      break;
    }

    for (const file of files) {
      processed += 1;
      if (dryRun) {
        console.log(`• [dry-run] ${file.id} (${file.mimeType}, ${file.size} bytes)`);
        continue;
      }

      try {
        await storageService.reencryptFile(file);
        updated += 1;
        console.log(`• re-encrypted ${file.id} (${file.filename})`);
      } catch (error) {
        console.error(`✖ Failed to re-encrypt ${file.id}:`, error);
      }
    }
  }

  console.log(
    dryRun
      ? `✅ Dry-run finished. ${processed} files inspected.`
      : `✅ Completed. ${updated} files re-encrypted with the current master key.`
  );
}

main()
  .catch((error) => {
    console.error('Unexpected failure while re-encrypting files:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
