import { Injectable } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private client: BrevoClient;

  constructor() {
    this.client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! });
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