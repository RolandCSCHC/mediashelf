import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Resend } from 'resend';
import type { OutboundEmail } from './outbound-email';

/**
 * Sends mail through Resend. RESEND_FROM must be an address on a domain
 * verified in Resend; after that, any recipient works. Replies go to the
 * person who shared the list, not the From address.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async send(message: OutboundEmail): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM?.trim();
    if (!apiKey || !fromEmail) {
      throw new ServiceUnavailableException(
        'Sharing by email is not configured',
      );
    }

    const resend = new Resend(apiKey);

    try {
      const { error } = await resend.emails.send({
        from: `MediaShelf <${fromEmail}>`,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        attachments: [
          {
            filename: message.attachment.filename,
            content: Buffer.from(message.attachment.content, 'utf8').toString(
              'base64',
            ),
            contentType: 'application/json',
          },
        ],
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      this.logger.error(
        'Resend rejected the email',
        error instanceof Error ? error.message : error,
      );
      throw new BadGatewayException('Could not send the email');
    }
  }
}
