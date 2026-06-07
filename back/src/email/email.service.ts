import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

    this.logger.log(`Gmail user: ${user} | pass length: ${pass?.length ?? 0}`);

    // Port 587 + STARTTLS — works everywhere including Windows and Render
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
    });

    // Verify connection at startup and log the result
    this.transporter.verify((err) => {
      if (err) {
        this.logger.error(`SMTP connection FAILED: ${err.message}`);
      } else {
        this.logger.log('SMTP connection OK — ready to send mail');
      }
    });
  }

  async testEmail(to: string): Promise<{ ok: boolean; message: string }> {
    try {
      await this.transporter.sendMail({
        from: `"MBE Test" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'MBE — Test email',
        html: '<p>If you see this, email is working ✅</p>',
      });
      return { ok: true, message: `Test email sent to ${to}` };
    } catch (e: any) {
      this.logger.error('Test email failed:', e.message);
      return { ok: false, message: e.message };
    }
  }

  async sendVerificationEmail(email: string, verificationLink: string) {
    try {
      await this.transporter.sendMail({
        from: `"MBE" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Подтвердите email — MBE',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2>Подтвердите ваш email</h2>
            <p>Нажмите кнопку ниже чтобы подтвердить регистрацию в MBE.</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px;">
              Подтвердить email
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (e: any) {
      this.logger.error(`Failed to send verification email: ${e.message}`);
    }
  }

  async sendStaffInviteEmail(email: string, name: string, verifyLink: string, tempPassword: string) {
    try {
      await this.transporter.sendMail({
        from: `"MBE" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Вас добавили в команду — MBE',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="margin-bottom: 8px;">Привет, ${name}! 👋</h2>
            <p style="color: #555;">Вас добавили в команду через платформу <b>MBE</b>.</p>
            <p style="color: #555;">Ваш временный пароль для входа:</p>
            <div style="font-size: 24px; font-weight: bold; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; display: inline-block; letter-spacing: 2px;">${tempPassword}</div>
            <p style="color: #555; margin-top: 20px;">Сначала подтвердите ваш email, нажав кнопку ниже:</p>
            <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 8px;">
              Подтвердить email и войти
            </a>
            <p style="color: #aaa; font-size: 12px; margin-top: 24px;">При первом входе вас попросят сменить пароль.</p>
          </div>
        `,
      });
      this.logger.log(`Staff invite sent to ${email}`);
    } catch (e: any) {
      this.logger.error(`Failed to send staff invite: ${e.message}`);
    }
  }
}
