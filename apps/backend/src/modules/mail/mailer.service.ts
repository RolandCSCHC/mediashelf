import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { OutboundEmail } from './outbound-email';

/**
 * Sends mail through the Gmail account in GMAIL_USER. An app password is
 * enough, so sharing does not depend on a domain or a third-party signup.
 * A new connection is opened per message so a serverless instance does not
 * keep an SMTP socket around.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async send(message: OutboundEmail): Promise<void> {
    const user = process.env.GMAIL_USER?.trim();
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
    if (!user || !pass) {
      throw new ServiceUnavailableException('Sharing by email is not configured');
    }

    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    try {
      await transport.sendMail({
        from: `MediaShelf <${user}>`,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        attachments: [
          {
            filename: message.attachment.filename,
            content: message.attachment.content,
            contentType: 'application/json',
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        'Gmail rejected the email',
        error instanceof Error ? error.message : error,
      );
      throw new BadGatewayException('Could not send the email');
    } finally {
      transport.close();
    }
  }
}
