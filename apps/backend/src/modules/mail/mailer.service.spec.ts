import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer from 'nodemailer';
import { MailerService } from './mailer.service';
import type { OutboundEmail } from './outbound-email';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
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
  const originalUser = process.env.GMAIL_USER;
  const originalPass = process.env.GMAIL_APP_PASSWORD;
  const sendMail = jest.fn();
  const close = jest.fn();
  const createTransport = nodemailer.createTransport as jest.Mock;
  let service: MailerService;

  beforeEach(() => {
    process.env.GMAIL_USER = 'relovia.app@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop';
    sendMail.mockReset();
    close.mockReset();
    createTransport.mockReset();
    createTransport.mockReturnValue({ sendMail, close });
    sendMail.mockResolvedValue({ messageId: '1' });
    service = new MailerService();
  });

  afterEach(() => {
    if (originalUser === undefined) {
      delete process.env.GMAIL_USER;
    } else {
      process.env.GMAIL_USER = originalUser;
    }
    if (originalPass === undefined) {
      delete process.env.GMAIL_APP_PASSWORD;
    } else {
      process.env.GMAIL_APP_PASSWORD = originalPass;
    }
  });

  it('sends the JSON attachment from the Gmail account', async () => {
    await service.send(message);

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'relovia.app@gmail.com',
        pass: 'abcdefghijklmnop',
      },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'MediaShelf <relovia.app@gmail.com>',
      to: 'ada@example.com',
      replyTo: 'owner@example.com',
      subject: 'MediaShelf: Sci-fi',
      text: 'A list for you.',
      attachments: [
        {
          filename: 'mediashelf-list-sci-fi-2026-08-23.json',
          content: '{"ok":true}',
          contentType: 'application/json',
        },
      ],
    });
    expect(close).toHaveBeenCalled();
  });

  it('refuses to send when Gmail is not configured', async () => {
    delete process.env.GMAIL_APP_PASSWORD;

    await expect(service.send(message)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('hides Gmail failures from the caller', async () => {
    sendMail.mockRejectedValue(new Error('Invalid login'));

    await expect(service.send(message)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(close).toHaveBeenCalled();
  });
});
