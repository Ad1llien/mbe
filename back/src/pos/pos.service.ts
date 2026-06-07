import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  getProducts(ownerId: string) {
    return this.prisma.product.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createProduct(ownerId: string, data: { name: string; sku: string; price: number; unit?: string }) {
    return this.prisma.product.create({ data: { ...data, ownerId } });
  }

  deleteProduct(id: string, ownerId: string) {
    return this.prisma.product.delete({ where: { id, ownerId } });
  }

  getReceipts(ownerId: string) {
    return this.prisma.receipt.findMany({
      where: { ownerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReceipt(ownerId: string, cashierId: string, lines: { productId: string; name: string; price: number; qty: number }[]) {
    const count = await this.prisma.receipt.count({ where: { ownerId } });
    const number = `Z-${1001 + count}`;
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    return this.prisma.receipt.create({
      data: {
        ownerId,
        number,
        total,
        cashierId,
        items: { create: lines.map(l => ({ ...l })) },
      },
      include: { items: true },
    });
  }

  voidReceipt(id: string, ownerId: string, reason: string) {
    return this.prisma.receipt.update({
      where: { id, ownerId },
      data: { voided: true, voidReason: reason },
    });
  }
}
