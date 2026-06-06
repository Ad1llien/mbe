import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    console.log('[EmailService] RESEND_API_KEY present:', !!key);
    this.resend = new Resend(key);
  }

  async sendVerificationEmail(email: string, verificationLink: string) {
    console.log('[EmailService] sendVerificationEmail called for', email);
    try {
      const { error } = await this.resend.emails.send({
        from: 'MBE <onboarding@resend.dev>',
        to: [email],
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
      if (error) console.error('Resend error:', error);
      else console.log('Verification email sent to', email);
    } catch (e) {
      console.error('Resend exception:', e);
    }
  }

  async sendStaffInviteEmail(email: string, name: string, verifyLink: string, tempPassword: string) {
    try {
      const { error } = await this.resend.emails.send({
        from: 'MBE <onboarding@resend.dev>',
        to: [email],
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
      if (error) console.error('Resend error:', error);
      else console.log('Staff invite sent to', email);
    } catch (e) {
      console.error('Resend exception:', e);
    }
  }
}
