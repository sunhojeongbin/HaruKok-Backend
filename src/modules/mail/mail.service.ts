import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendEmailVerificationCode(email: string, code: string) {
    const from = process.env.MAIL_FROM ?? 'no-reply@example.com';

    try {
      this.logger.debug(
        `SMTP 설정: host=${process.env.SMTP_HOST}, user=${process.env.SMTP_USER}, port=${process.env.SMTP_PORT}`,
      );

      await this.transporter.sendMail({
        from,
        to: email,
        subject: '[하루콕] 이메일 인증 코드',
        text: `인증 코드: ${code}\n유효시간은 10분입니다.`,
      });

      this.logger.log(`이메일 발송 성공: ${email}`);
    } catch (error) {
      this.logger.error(
        `이메일 발송 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
