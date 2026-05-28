import { Injectable } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private client: BrevoClient;

  constructor() {
    this.client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! });
  }

  async sendStaffInviteEmail(email: string, name: string, verifyLink: string, tempPassword: string) {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: { name: 'MBE', email: 'akadilzh2004kz@gmail.com' },
        to: [{ email }],
        subject: 'Вас добавили в команду — MBE',
        htmlContent: `
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
      console.log('Staff invite sent to', email);
    } catch (e) {
      console.error('Brevo error:', e);
    }
  }

  async sendVerificationEmail(email: string, verificationLink: string) {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          name: 'MBE',
          email: 'akadilzh2004kz@gmail.com',
        },
        to: [{ email }],
        subject: 'Подтвердите email — MBE',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Подтвердите ваш email</h2>
            <p>Нажмите кнопку ниже чтобы подтвердить регистрацию в MBE.</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px;">
              Подтвердить email
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
          </div>
        `,
      });
      console.log('Email sent to', email);
    } catch (e) {
      console.error('Brevo error:', e);
    }
  }
}