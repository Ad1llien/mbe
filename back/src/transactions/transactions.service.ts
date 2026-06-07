import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  getTransactions(ownerId: string) {
    return this.prisma.transaction.findMany({
      where: { ownerId },
      orderBy: { date: 'desc' },
    });
  }

  createTransaction(
    ownerId: string,
    data: {
      label: string;
      amount: number;
      type: string;
      date?: string;
      fromDealId?: string;
      receipt?: string;
      category?: string;
    },
  ) {
    return this.prisma.transaction.create({
      data: {
        ownerId,
        label: data.label,
        amount: data.amount,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
        fromDealId: data.fromDealId,
        receipt: data.receipt,
        category: data.category,
      },
    });
  }

  deleteTransaction(id: string, ownerId: string) {
    return this.prisma.transaction.delete({ where: { id, ownerId } });
  }
}
