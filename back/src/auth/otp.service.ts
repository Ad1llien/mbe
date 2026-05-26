// back/src/auth/otp.service.ts
import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class OtpService {
  private client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  private codes = new Map<string, string>(); // временно, потом Redis

  async sendWhatsApp(phone: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes.set(phone, code);

    await this.client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone}`,
      body: `Ваш код подтверждения MBE: ${code}`,
    });
  }

  verify(phone: string, code: string): boolean {
    const stored = this.codes.get(phone);
    if (stored === code) {
      this.codes.delete(phone);
      return true;
    }
    return false;
  }
}