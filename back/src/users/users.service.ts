import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

function genCode(): string {
  return 'MBE-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, referralCode: true, bonusBalance: true, createdAt: true },
    });
  }

  async findByReferralCode(code: string) {
    return this.prisma.user.findUnique({ where: { referralCode: code } });
  }

  async create(email: string, password: string, verificationToken: string, referredBy?: string) {
    // Generate unique code
    let referralCode = genCode();
    while (await this.prisma.user.findUnique({ where: { referralCode } })) {
      referralCode = genCode();
    }

    const user = await this.prisma.user.create({
      data: { email, password, verificationToken, referralCode, referredBy },
      select: { id: true, email: true, referralCode: true, createdAt: true },
    });

    // Credit bonus to referrer ($15 per new sign-up)
    if (referredBy) {
      await this.prisma.user.updateMany({
        where: { referralCode: referredBy },
        data: { bonusBalance: { increment: 15 } },
      });
    }

    return user;
  }

  async findByVerificationToken(token: string) {
    return this.prisma.user.findFirst({ where: { verificationToken: token } });
  }

  async markAsVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: true, verificationToken: null },
    });
  }

  // Get all users who used this referral code
  async getReferrals(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { referrals: [], bonusBalance: 0, referralCode: '' };

    const referrals = await this.prisma.user.findMany({
      where: { referredBy: user.referralCode },
      select: { id: true, email: true, isVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      referralCode: user.referralCode,
      bonusBalance: user.bonusBalance,
      referrals: referrals.map(r => ({
        id: r.id,
        email: r.email,
        isVerified: r.isVerified,
        joinedAt: r.createdAt,
        reward: 15,
        status: r.isVerified ? 'active' : 'pending',
      })),
    };
  }

  async useBonus(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bonusBalance: true },
    });
    if (!user || user.bonusBalance < amount) {
      return { success: false, message: 'Insufficient bonus balance' };
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { bonusBalance: { decrement: amount } },
    });
    return { success: true, remaining: user.bonusBalance - amount };
  }
}
