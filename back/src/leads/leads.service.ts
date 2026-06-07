import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async createLead(businessId: string, secret: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
  }) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
  
    if (!business || business.webhookSecret !== secret) {
      throw new Error('Invalid secret');
    }
  
    return this.prisma.lead.create({
      data: { businessId, ...data },
    });
  }

  getLeads(businessId: string) {
    return this.prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { status },
    });
  }

  createBusiness(userId: string, name: string) {
    return this.prisma.business.create({
      data: { userId, name },
    });
  }

  async ensureBusiness(userId: string, name: string) {
    // findFirst + create instead of upsert — works even without DB unique constraint
    const existing = await this.prisma.business.findFirst({ where: { userId } });
    if (existing) return existing;
    try {
      return await this.prisma.business.create({ data: { userId, name } });
    } catch {
      // Race condition: two parallel requests created at same time — return existing
      return this.prisma.business.findFirst({ where: { userId } });
    }
  }
  getAllBusinesses() {
    return this.prisma.business.findMany();
  }

  getMyBusiness(userId: string) {
    return this.prisma.business.findUnique({
      where: { userId },
    });
  }

  regenerateSecret(userId: string) {
    return this.prisma.business.update({
      where: { userId },
      data: { webhookSecret: randomUUID() },
    });
  }
}