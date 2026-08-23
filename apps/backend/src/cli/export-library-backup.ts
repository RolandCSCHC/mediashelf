import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  libraryBackupRelativePath,
  utcDateStamp,
} from '../modules/backup/backup-file-name';
import { BackupService } from '../modules/backup/backup.service';
import { PrismaService } from '../modules/prisma/prisma.service';

const logger = new Logger('ExportLibraryBackup');

async function main(): Promise<void> {
  const outDir = resolve(
    process.env.BACKUP_OUT_DIR ?? process.argv[2] ?? 'backup-out',
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const backupService = app.get(BackupService);
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
      orderBy: { email: 'asc' },
    });

    if (users.length === 0) {
      throw new Error('No users found — refusing to write an empty backup.');
    }

    const date = utcDateStamp();

    for (const user of users) {
      const payload = await backupService.exportForUser(user.id);
      const relativePath = libraryBackupRelativePath(user.email, date);
      const filePath = resolve(outDir, relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(
        filePath,
        `${JSON.stringify(payload, null, 2)}\n`,
        'utf8',
      );
      logger.log(
        `Wrote ${filePath} (${String(payload.media.length)} titles, ${String(payload.lists.length)} lists) for ${user.email}`,
      );
    }
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  logger.error(
    error instanceof Error ? error.message : 'Library backup export failed',
    error instanceof Error ? error.stack : undefined,
  );
  process.exitCode = 1;
});
