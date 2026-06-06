import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  private codes = new Map<string, string>();

  async sendWhatsApp(phone: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes.set(phone, code);
    // TODO: integrate Twilio or WhatsApp provider
    console.log(`OTP for ${phone}: ${code}`);
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
