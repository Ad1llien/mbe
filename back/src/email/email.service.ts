import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey = process.env.BREVO_API_KEY ?? '';
  private readonly sender = {
    name: 'MBE',
    email: process.env.BREVO_SENDER ?? process.env.BREVO_USER ?? 'noreply@mbe.app',
  };

  private async send(to: string, subject: string, html: string) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: this.sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Brevo API ${res.status}: ${err}`);
    }

    return res.json();
  }

  async testEmail(to: string): Promise<{ ok: boolean; message: string }> {
    try {
      await this.send(to, 'MBE — Test email', '<p>If you see this, email is working ✅</p>');
      this.logger.log(`Test email sent to ${to}`);
      return { ok: true, message: `Test email sent to ${to}` };
    } catch (e: any) {
      this.logger.error('Test email failed:', e.message);
      return { ok: false, message: e.message };
    }
  }

  async sendVerificationEmail(email: string, verificationLink: string) {
    try {
      await this.send(
        email,
        'Подтвердите email — MBE',
        `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2>Подтвердите ваш email</h2>
          <p>Нажмите кнопку ниже чтобы подтвердить регистрацию в MBE.</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px;">
            Подтвердить email
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
        </div>
        `,
      );
      this.logger.log(`Verification email sent to ${email}`);
    } catch (e: any) {
      this.logger.error(`Failed to send verification email: ${e.message}`);
    }
  }

  async sendStaffInviteEmail(
    email: string,
    name: string,
    verifyLink: string,
    tempPassword: string,
  ) {
    try {
      await this.send(
        email,
        'Вас добавили в команду — MBE',
        `
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
      );
      this.logger.log(`Staff invite sent to ${email}`);
    } catch (e: any) {
      this.logger.error(`Failed to send staff invite: ${e.message}`);
    }
  }
}
