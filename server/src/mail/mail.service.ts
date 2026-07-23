import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: SESClient;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    this.client = new SESClient({
      region: this.config.getOrThrow('AWS_REGION'),
    });
    this.fromEmail = this.config.getOrThrow('AWS_SES_FROM_EMAIL');
  }

  async send(to: string, subject: string, html: string) {
    try {
      await this.client.send(
        new SendEmailCommand({
          Source: this.fromEmail,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } },
          },
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
