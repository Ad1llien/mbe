import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(email: string, password: string, verificationToken: string) {
    return this.prisma.user.create({
      data: {
        email,
        password,
        verificationToken,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }
  async findByVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: { verificationToken: token },
    });
  }
  
  async markAsVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });
  }
}