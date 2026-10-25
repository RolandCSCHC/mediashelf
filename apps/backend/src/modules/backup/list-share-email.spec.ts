import { buildListShareEmail } from './list-share-email';

describe('buildListShareEmail', () => {
  const message = buildListShareEmail({
    listName: 'Sci-fi\nFavorites',
    senderName: 'Ada',
    senderEmail: 'ada@example.com',
    recipientEmail: '  Friend@Example.com ',
    filename: 'mediashelf-list-sci-fi-2026-08-23.json',
    json: '{"version":1}',
    locale: 'en',
  });

  it('addresses the recipient in lowercase and keeps the subject on one line', () => {
    expect(message.to).toBe('friend@example.com');
    expect(message.replyTo).toBe('ada@example.com');
    expect(message.subject).toBe('MediaShelf: Sci-fi Favorites');
    expect(message.subject).not.toContain('\n');
  });

  it('names the sender and explains how to import the attachment', () => {
    expect(message.text).toContain('Ada (ada@example.com)');
    expect(message.text).toContain('open Backup');
    expect(message.text).not.toContain('Copia de seguridad');
    expect(message.attachment).toEqual({
      filename: 'mediashelf-list-sci-fi-2026-08-23.json',
      content: '{"version":1}',
    });
  });

  it('writes the body in Spanish when that language is selected', () => {
    const spanish = buildListShareEmail({
      listName: 'Sci-fi',
      senderName: 'Ada',
      senderEmail: 'ada@example.com',
      recipientEmail: 'friend@example.com',
      filename: 'list.json',
      json: '{}',
      locale: 'es',
    });

    expect(spanish.text).toContain(
      'Ada (ada@example.com) compartió la lista de MediaShelf «Sci-fi» contigo.',
    );
    expect(spanish.text).toContain('Copia de seguridad');
    expect(spanish.text).not.toContain('open Backup');
  });

  it('uses the account email when the sender has no name', () => {
    const unnamed = buildListShareEmail({
      listName: 'Horror',
      senderName: '   ',
      senderEmail: 'ada@example.com',
      recipientEmail: 'friend@example.com',
      filename: 'list.json',
      json: '{}',
      locale: 'en',
    });

    expect(unnamed.text.startsWith('ada@example.com shared')).toBe(true);
  });
});
