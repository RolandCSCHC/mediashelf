import {
  BadGatewayException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Resend } from 'resend';
import { MailerService } from './mailer.service';
import type { OutboundEmail } from './outbound-email';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => mockSend(...args) },
  })),
}));

const message: OutboundEmail = {
  to: 'ada@example.com',
  replyTo: 'owner@example.com',
  subject: 'MediaShelf: Sci-fi',
  text: 'A list for you.',
  attachment: {
    filename: 'mediashelf-list-sci-fi-2026-08-23.json',
    content: '{"ok":true}',
  },
};

describe('MailerService', () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM;
  let service: MailerService;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM = 'share@mediashelf.mov';
    mockSend.mockReset();
    jest.mocked(Resend).mockClear();
    mockSend.mockResolvedValue({ data: { id: '1' }, error: null });
    service = new MailerService();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }
    if (originalFrom === undefined) {
      delete process.env.RESEND_FROM;
    } else {
      process.env.RESEND_FROM = originalFrom;
    }
  });

  it('sends the JSON attachment from the verified domain', async () => {
    await service.send(message);

    expect(Resend).toHaveBeenCalledWith('re_test_key');
    expect(mockSend).toHaveBeenCalledWith({
      from: 'MediaShelf <share@mediashelf.mov>',
      to: 'ada@example.com',
      replyTo: 'owner@example.com',
      subject: 'MediaShelf: Sci-fi',
      text: 'A list for you.',
      attachments: [
        {
          filename: 'mediashelf-list-sci-fi-2026-08-23.json',
          content: Buffer.from('{"ok":true}', 'utf8').toString('base64'),
          contentType: 'application/json',
        },
      ],
    });
  });

  it('refuses to send when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY;

    await expect(service.send(message)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(Resend).not.toHaveBeenCalled();
  });

  it('hides Resend failures from the caller', async () => {
    const errorLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid from address', name: 'validation_error' },
    });

    await expect(service.send(message)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(errorLog).toHaveBeenCalled();
    errorLog.mockRestore();
  });
});
