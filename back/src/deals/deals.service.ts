import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  getDeals(ownerId: string) {
    return this.prisma.deal.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createDeal(ownerId: string, data: { client: string; title: string; amount: number; stageId: string }) {
    return this.prisma.deal.create({ data: { ...data, ownerId } });
  }

  updateStage(id: string, ownerId: string, stageId: string) {
    return this.prisma.deal.update({ where: { id, ownerId }, data: { stageId } });
  }

  deleteDeal(id: string, ownerId: string) {
    return this.prisma.deal.delete({ where: { id, ownerId } });
  }
}
