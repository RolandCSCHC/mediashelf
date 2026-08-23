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
