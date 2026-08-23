import {
  backupUserFolderName,
  libraryBackupFileName,
  libraryBackupRelativePath,
  utcDateStamp,
} from './backup-file-name';

describe('utcDateStamp', () => {
  it('returns the UTC calendar date', () => {
    expect(utcDateStamp(new Date('2026-08-23T04:30:00.000Z'))).toBe(
      '2026-08-23',
    );
  });
});

describe('backupUserFolderName', () => {
  it('uses the lowercased email as the folder name', () => {
    expect(backupUserFolderName('Roland@Example.com')).toBe(
      'roland@example.com',
    );
  });

  it('strips path separators so the email cannot escape the backup root', () => {
    expect(backupUserFolderName('roland@example.com/../other')).toBe(
      'roland@example.com_.._other',
    );
  });

  it('falls back when the email is empty', () => {
    expect(backupUserFolderName('   ')).toBe('user');
  });
});

describe('libraryBackupFileName', () => {
  it('matches the Backup page filename', () => {
    expect(libraryBackupFileName('2026-08-23')).toBe(
      'mediashelf-backup-2026-08-23.json',
    );
  });
});

describe('libraryBackupRelativePath', () => {
  it('puts the JSON inside a folder named after the email', () => {
    expect(libraryBackupRelativePath('roland@example.com', '2026-08-23')).toBe(
      'roland@example.com/mediashelf-backup-2026-08-23.json',
    );
  });
});
