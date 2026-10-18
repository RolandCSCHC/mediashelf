/** UTC calendar date, matching the Backup page download stamp. */
export function utcDateStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Folder named after the account email (`you@example.com`). */
export function backupUserFolderName(email: string): string {
  const folder = email.trim().toLowerCase().replace(/[/\\]/g, '_');
  return folder || 'user';
}

/** Same filename the Backup page downloads. */
export function libraryBackupFileName(date: string): string {
  return `mediashelf-backup-${date}.json`;
}

/** Path under the backup root: `{email}/mediashelf-backup-YYYY-MM-DD.json`. */
export function libraryBackupRelativePath(email: string, date: string): string {
  return `${backupUserFolderName(email)}/${libraryBackupFileName(date)}`;
}

/** `mediashelf-list-{slug}-{YYYY-MM-DD}.json` */
export function listShareFileName(name: string, date: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `mediashelf-list-${slug || 'list'}-${date}.json`;
}
