import type { OutboundEmail } from '../mail/outbound-email';

export type ListShareEmailInput = {
  listName: string;
  senderName: string | null;
  senderEmail: string;
  recipientEmail: string;
  filename: string;
  json: string;
};

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function senderLabel(name: string | null, email: string): string {
  const trimmed = name ? oneLine(name) : '';
  return trimmed ? `${trimmed} (${email})` : email;
}

/** Plain-text message whose attachment is the merge-importable list JSON. */
export function buildListShareEmail(input: ListShareEmailInput): OutboundEmail {
  const listName = oneLine(input.listName) || 'List';
  const sender = senderLabel(input.senderName, input.senderEmail);
  const recipient = input.recipientEmail.trim().toLowerCase();

  return {
    to: recipient,
    replyTo: input.senderEmail,
    subject: `MediaShelf: ${listName}`,
    text: [
      `${sender} shared the MediaShelf list "${listName}" with you.`,
      '',
      'The attached JSON uses the same format as a MediaShelf backup. Sign in, open Backup, and import the file. Existing titles are skipped. Missing lists and memberships are added. Notes and date watched are not included.',
      '',
      '—',
      '',
      `${sender} compartió la lista de MediaShelf «${listName}» contigo.`,
      '',
      'El JSON adjunto usa el mismo formato que una copia de MediaShelf. Inicia sesión, abre Copia de seguridad e importa el archivo. Los títulos que ya existen se omiten. Se añaden las listas y pertenencias que falten. Las notas y la fecha de visto no se incluyen.',
    ].join('\n'),
    attachment: {
      filename: input.filename,
      content: input.json,
    },
  };
}
